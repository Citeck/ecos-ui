import cloneDeep from 'lodash/cloneDeep';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';
import isNil from 'lodash/isNil';
import set from 'lodash/set';
import * as queryString from 'query-string';
import { call, put, select, takeEvery, takeLatest, all, race, take } from 'redux-saga/effects';

import { applyJournalSetting, execRecordsActionComplete, runSearch, setJournalSetting, setPredicate } from '../actions/journals';
import {
  applyFilter,
  getBoardConfig,
  getBoardData,
  getBoardList,
  getNextPage,
  moveCard,
  reloadBoardData,
  resetFilter,
  runAction,
  runSearchCard,
  selectBoardId,
  selectTemplateId,
  setBoardConfig,
  setBoardList,
  setDataCards,
  setFormProps,
  setIsEnabled,
  setIsFiltered,
  setLoading,
  setLoadingColumns,
  setPagination,
  setResolvedActions,
  setDefaultBoardAndTemplate,
  setTotalCount,
  setOriginKanbanSettings,
  setKanbanSettings,
  applyPreset,
  cancelGetNextBoardPage,
  setSwimlaneGrouping,
  changeSwimlaneGrouping,
  setSwimlaneValues,
  setSwimlaneCellData,
  loadMoreSwimlaneCell,
  setSwimlaneCellLoading,
  moveSwimlaneCard,
  refreshCardData
} from '../actions/kanban';
import EcosFormUtils from '../components/EcosForm/EcosFormUtils';
import { ParserPredicate } from '../components/Filters/predicates';
import { DEFAULT_PAGINATION, isKanban, KANBAN_SELECTOR_MODE } from '../components/Journals/constants';
import JournalsService from '../components/Journals/service/journalsService';
import Records from '../components/Records/Records';
import RecordActions from '../components/Records/actions/recordActions';
import { PREDICATE_EQ } from '../components/Records/predicates/predicates';
import { JournalUrlParams, KanbanUrlParams, SourcesId } from '../constants';
import JournalsConverter from '../dto/journals';
import KanbanConverter from '../dto/kanban';
import { t } from '../helpers/export/util';
import { wrapArgs, wrapSaga } from '../helpers/redux';
import { decodeLink, getSearchParams, getUrlWithoutOrigin, getWorkspaceId } from '../helpers/urls';
import { isExistValue } from '../helpers/util';
import { emptyJournalConfig } from '../reducers/journals';
import { selectJournalData, selectSettingsData, selectViewMode } from '../selectors/journals';
import { selectKanban, selectKanbanPageProps, selectPagination, selectSwimlaneGrouping } from '../selectors/kanban';
import PageService from '../services/PageService';

import { getGridParams, getJournalConfig, getJournalSettingFully } from './journals';

import AuthorityService from '@/services/authrority/AuthorityService';
import { NotificationManager } from '@/services/notifications';

function buildCardAttrMap(formProps, boardConfig) {
  const { attributes, inputByKey } = EcosFormUtils.preProcessingAttrs(get(formProps, 'formFields', []));
  const attrMap = { ...attributes, ...KanbanConverter.getCardAttributes() };

  if (boardConfig.cardTitleTemplate) {
    const templateAttrs = EcosFormUtils.getAttrsFromTemplate(boardConfig.cardTitleTemplate);
    templateAttrs.forEach(key => { attrMap[key] = key; });
  }

  if (boardConfig.coloredAttr) {
    attrMap['_colorAttrValue'] = boardConfig.coloredAttr + '?str';
  }

  return { attrMap, inputByKey };
}

function collectRecordRefsFromSwimlanes(swimlanes, columns) {
  return columns.map(col => {
    const refs = [];
    (swimlanes || []).forEach(sl => {
      const cell = sl.cells[col.id];
      if (cell && cell.records) {
        cell.records.forEach(rec => { if (rec.cardId) refs.push(rec.cardId); });
      }
    });
    return refs;
  });
}

function findCardInSwimlanes(swimlanes, recordRef) {
  for (const sl of swimlanes) {
    for (const colId of Object.keys(sl.cells)) {
      const cell = sl.cells[colId];
      if (cell?.records?.some(r => r.id === recordRef || r.cardId === recordRef)) {
        return { swimlaneId: sl.id, statusId: colId };
      }
    }
  }
  return null;
}

function findCardInDataCards(dataCards, recordRef) {
  for (let i = 0; i < dataCards.length; i++) {
    const records = get(dataCards, [i, 'records'], []);
    const idx = records.findIndex(r => r.id === recordRef || r.cardId === recordRef);
    if (idx >= 0) {
      return { columnIndex: i, cardIndex: idx };
    }
  }
  return null;
}

function* buildSwimlaneCellQueryParams({ api, stateId, boardConfig, formProps, swimlaneGrouping, swimlaneId, journalConfig, journalSetting }) {
  const params = yield getGridParams({ journalConfig, journalSetting, pagination: DEFAULT_PAGINATION });
  const predicates = ParserPredicate.replacePredicatesType(JournalsConverter.cleanUpPredicate(params.predicates));

  const urlProps = getSearchParams();
  const searchText = urlProps[JournalUrlParams.SEARCH];
  const searchPredicate = isExistValue(searchText)
    ? ParserPredicate.getSearchPredicates({
        text: searchText,
        columns: ParserPredicate.getAvailableSearchColumns(journalSetting.columns)
      })
    : [];

  const { attrMap, inputByKey } = buildCardAttrMap(formProps, boardConfig);

  delete params.columns;
  delete params.groupBy;
  delete params.groupActions;
  delete params.attributes;

  const journalColumns = cloneDeep(journalConfig.columns);

  const swimlaneAttrPredicate = swimlaneId === '__unassigned__'
    ? { t: 'empty', att: swimlaneGrouping.attribute }
    : { t: 'eq', att: swimlaneGrouping.attribute, val: swimlaneId };

  return {
    queryParams: { params, predicates, searchPredicate, attrMap, journalColumns, swimlaneAttrPredicate },
    inputByKey
  };
}

function processCardRecords(records, inputByKey, boardConfig) {
  return (records || []).map(recordData => {
    let newData = EcosFormUtils.postProcessingAttrsData({ recordData, inputByKey });
    if (boardConfig.cardTitleTemplate) {
      newData.cardTitle = EcosFormUtils.renderByTemplate(boardConfig.cardTitleTemplate, newData);
    }
    return newData;
  });
}

export function* sagaGetBoardList({ api }, { payload }) {
  try {
    const { journalId, stateId, enableEmptyData } = payload;

    const boardList = yield call(api.kanban.getBoardList, { journalId });
    const templateList = yield call(api.kanban.getBoardSettings, journalId);

    const isEnabled = !isEmpty(boardList);

    yield put(setIsEnabled({ isEnabled, stateId }));
    if (isEnabled || enableEmptyData) {
      yield put(
        setBoardList({
          templateList,
          boardList: KanbanConverter.prepareList(boardList),
          stateId
        })
      );
    }
  } catch (e) {
    console.error('[kanban/sagaGetBoardList saga] error', e);
  }
}

export function* sagaRecordActionComplete({ stateId, w, ...otherProps }, { payload, ...extra }) {
  try {
    const { records } = payload || {};
    const isBoard = records && (records.startsWith(SourcesId.BOARD) || records.startsWith(SourcesId.RESOLVED_BOARD));

    if (isBoard) {
      yield put(setLoading({ stateId, isLoading: true }));
      yield put(getBoardData({ stateId, boardId: payload.records }));
    }
  } catch (e) {
    console.error('[kanban/sagaGetBoardConfig saga] error', e);
  }
}

export function* sagaGetBoardConfig({ api }, { payload }) {
  try {
    const { boardId, templateId, stateId } = payload;
    const { boardDef, ...config } = yield call(api.kanban.getBoardConfig, { boardId, templateId });
    const boardConfig = KanbanConverter.prepareConfig(config);

    if (config) {
      boardId && (boardConfig.id = boardId);
      templateId && (boardConfig.templateId = templateId);
    }

    yield put(setBoardConfig({ boardConfig, stateId }));

    if (boardConfig) {
      const typeRef = boardConfig.typeRef;
      if (typeRef) {
        const unPreparedStatuses = yield call(api.kanban.getTypeStatuses, typeRef);
        const statuses = KanbanConverter.prepareStatuses(unPreparedStatuses);
        yield put(setOriginKanbanSettings({ originKanbanSettings: { statuses }, stateId }));
      }
    }

    return boardConfig;
  } catch (e) {
    console.error('[kanban/sagaGetBoardConfig saga] error', e);
  }
}

export function* sagaFormProps({ api }, { payload: { stateId, formId } }) {
  try {
    if (!formId) {
      throw new Error('No form ID ' + formId);
    }

    const form = yield call(EcosFormUtils.getFormById, formId, { formDefinition: 'definition?json', formI18n: 'i18n?json' });

    if (!form.formDefinition) {
      throw new Error('Form is not found for ID ' + formId);
    }

    const formFields = EcosFormUtils.getFormInputs(form.formDefinition);
    const formProps = { ...form, formFields };

    yield put(setFormProps({ stateId, formProps }));

    return formProps;
  } catch (e) {
    yield put(setFormProps({ stateId, formProps: {} }));
    NotificationManager.error(t('kanban.error.form-not-found'), t('error'));
    console.error('[kanban/sagaFormProps saga] error', e);
  }
}

export function* sagaGetBoardData({ api }, { payload }) {
  try {
    const { stateId, recordRefs, attrsToLoad, onlyLinked } = payload;
    const boardConfig = yield sagaGetBoardConfig({ api }, { payload });
    const formProps = yield sagaFormProps({ api }, { payload: { formId: boardConfig.cardFormRef, stateId } });
    let { journalConfig, journalSetting } = yield select(selectJournalData, stateId);

    if (!!boardConfig.journalRef && (isEmpty(journalConfig) || isEqual(journalConfig, emptyJournalConfig))) {
      const w = wrapArgs(stateId);

      journalConfig = yield getJournalConfig({ api, w, force: true }, boardConfig.journalRef);
      journalSetting = yield getJournalSettingFully(api, { journalConfig, stateId }, w);
    }

    // Extract colored formatter column for card border coloring (used in both grouped and non-grouped modes)
    const coloredColumn = (journalConfig.columns || []).find(
      col => get(col, 'newFormatter.type') === 'colored'
    );
    if (coloredColumn) {
      boardConfig.coloredAttr = coloredColumn.attribute || coloredColumn.dataField;
      boardConfig.colorMap = get(coloredColumn, 'newFormatter.config.color', {});
      yield put(setBoardConfig({ boardConfig, stateId }));
    }

    const pagination = DEFAULT_PAGINATION;

    yield put(setPagination({ stateId, pagination }));
    yield sagaGetData(
      { api },
      { payload: { stateId, boardConfig, attrsToLoad, onlyLinked, journalSetting, journalConfig, formProps, pagination, recordRefs } }
    );
    const { boardId, templateId, isDefaultBoardAndTemplate } = payload;

    if (isDefaultBoardAndTemplate && (!isNil(boardId) || !isNil(templateId))) {
      yield call(sagaSetDefaultBoardAndTemplate, { api }, { payload: { boardId, templateId, stateId } });
    }
    yield put(setLoading({ stateId, isLoading: false }));
  } catch (e) {
    console.error('[kanban/sagaGetBoardData saga] error', e);
  }
}

export function* sagaGetData({ api }, { payload }) {
  try {
    const {
      boardConfig = {},
      journalConfig = {},
      journalSetting = {},
      formProps = {},
      pagination: _pagination = {},
      recordRefs,
      stateId,
      attrsToLoad,
      onlyLinked,
      isHandlePagination
    } = payload;

    let pagination = _pagination;
    if (isHandlePagination && get(pagination, 'page') >= 0 && get(pagination, 'maxItems') >= 0) {
      pagination.skipCount = pagination.page * pagination.maxItems;
      pagination.page += 1;
    }

    let params = yield getGridParams({ journalConfig, journalSetting, pagination });
    const { dataCards: prevDataCards, kanbanSettings } = yield select(selectKanban, stateId);

    const urlProps = getSearchParams();
    const searchText = urlProps[JournalUrlParams.SEARCH];
    const recordRef = urlProps[JournalUrlParams.RECORD_REF];
    let _journalConfig = cloneDeep(journalConfig);

    const journalColumns = cloneDeep(_journalConfig.columns);

    delete params.columns;
    delete params.groupBy;
    delete params.groupActions;
    delete params.attributes;
    delete _journalConfig.columns;

    const { attrMap, inputByKey } = buildCardAttrMap(formProps, boardConfig);
    params.attributes = attrMap;

    const predicates = ParserPredicate.replacePredicatesType(JournalsConverter.cleanUpPredicate(params.predicates));

    const searchPredicate = isExistValue(searchText)
      ? ParserPredicate.getSearchPredicates({
          text: searchText,
          columns: ParserPredicate.getAvailableSearchColumns(journalSetting.columns)
        })
      : [];

    if (get(journalSetting, 'kanban.columns') && !get(boardConfig, 'columns', []).every(col => !col.hideOldItems)) {
      journalSetting.kanban.columns = journalSetting.kanban.columns.map(col => {
        if (col && col.id) {
          const foundConfigColumn = (boardConfig.columns || []).find(c => c.id && c.id === col.id);
          if (foundConfigColumn) {
            col.hideOldItems = foundConfigColumn.hideOldItems;
            col.hideItemsOlderThan = foundConfigColumn.hideItemsOlderThan;
          }
        }

        return col;
      });
    }

    const result = yield all(
      (get(journalSetting, 'kanban.columns') || boardConfig.columns || []).map(function* (column, i) {
        if (get(prevDataCards, [i, 'records', 'length'], 0) === get(prevDataCards, [i, 'totalCount'])) {
          return {};
        }

        const colPredicate = KanbanConverter.preparePredicate(column);

        const statusModifiedPredicate = KanbanConverter.getStatusModifiedPredicate(column);

        const idsPredicate = Boolean(get(recordRefs, 'length'))
          ? {
              t: PREDICATE_EQ,
              att: 'id',
              val: recordRefs
            }
          : undefined;

        const settings = JournalsConverter.getSettingsForDataLoaderServer({
          ...params,
          onlyLinked,
          attrsToLoad,
          recordRef,
          predicates: [...predicates, colPredicate, idsPredicate, statusModifiedPredicate],
          searchPredicate
        });

        const res = yield call(
          [JournalsService, JournalsService.getJournalData],
          _journalConfig,
          { ...settings, columns: journalColumns },
          recordRefs
        );
        const status = column.id || '';

        return { ...res, status };
      })
    );

    if (result && isHandlePagination) {
      yield put(setPagination({ stateId, pagination }));
    }

    const dataCards = [];
    const newRecordRefs = [];

    result.forEach((data = {}, i) => {
      const prevRecords = get(prevDataCards, [i, 'records'], []);
      const prevTotalCount = get(prevDataCards, [i, 'totalCount'], 0);
      const prevStatus = get(prevDataCards, [i, 'status'], '');

      if (!data.records || data.error) {
        data.error && console.error('[kanban/sagaGetData saga] error column', data.error);
        dataCards.push({
          totalCount: prevTotalCount,
          records: prevRecords,
          error: get(data, 'error.message'),
          status: prevStatus
        });
      } else {
        const preparedRecords = data.records.map(recordData => {
          let newData = EcosFormUtils.postProcessingAttrsData({ recordData, inputByKey });

          if (boardConfig.cardTitleTemplate) {
            newData.cardTitle = EcosFormUtils.renderByTemplate(boardConfig.cardTitleTemplate, newData);
          }

          return newData;
        });

        newRecordRefs.push(preparedRecords.map(rec => rec.cardId));

        // only unique records
        const allRecords = [...new Map([...prevRecords, ...preparedRecords].map(record => [record.id, record])).values()];

        if (data.totalCount >= allRecords.length) {
          dataCards.push({ totalCount: data.totalCount, records: [...allRecords], status: data.status });
        } else {
          dataCards.push({ totalCount: data.totalCount, records: [...preparedRecords], status: data.status });
        }
      }
    });

    const kanbanColumnsIds = get(boardConfig, 'columns', []).length > 0 ? boardConfig.columns.map(col => col.id) : null;
    const totalCount = dataCards
      .filter(column => (kanbanColumnsIds ? kanbanColumnsIds.includes(column.status) : true))
      .reduce((count, col) => count + get(col, 'totalCount', 0), 0);

    yield put(setDataCards({ stateId, dataCards }));
    yield put(setTotalCount({ stateId, totalCount }));
    if (isEmpty(kanbanSettings)) {
      const hasWritePermission = yield call([AuthorityService, AuthorityService.hasConfigWritePermission], urlProps.boardId);
      yield put(setKanbanSettings({ stateId, kanbanSettings: journalSetting.kanban || {}, hasWritePermission }));
    }
    yield sagaGetActions({ api }, { payload: { boardConfig, newRecordRefs, stateId } });
  } catch (e) {
    console.error('[kanban/sagaGetData saga] error', e);
  }
}

export function* sagaGetActions({ api }, { payload }) {
  try {
    const { boardConfig = {}, newRecordRefs = [], stateId } = payload;
    const { resolvedActions: prevResolvedActions = [] } = yield select(selectKanban, stateId);

    const resolvedActions = yield (boardConfig.columns || []).map(function* (column, i) {
      const newResolvedActions = yield call([JournalsService, JournalsService.getRecordActions], boardConfig, newRecordRefs[i]);
      const status = column.id || '';
      const actions = { ...newResolvedActions.forRecord, status };

      return { ...get(prevResolvedActions, [i], {}), ...actions };
    });

    yield put(setResolvedActions({ stateId, resolvedActions }));
  } catch (e) {
    console.error('[kanban/sagaGetActions saga] error', e);
  }
}

export function* sagaSelectFromUrl({ api }, { payload }) {
  try {
    const urlData = queryString.parseUrl(getUrlWithoutOrigin());
    const { boardId, stateId, templateId, type = KANBAN_SELECTOR_MODE.BOARD, settings } = payload;

    const path = type === KANBAN_SELECTOR_MODE.TEMPLATES ? KanbanUrlParams.TEMPLATE_ID : KanbanUrlParams.BOARD_ID;
    const toggleId = type === KANBAN_SELECTOR_MODE.TEMPLATES ? templateId : boardId;
    if (toggleId !== undefined && get(urlData, ['query', path]) !== toggleId) {
      set(urlData, ['query', path], toggleId);
    }

    yield put(setLoading({ stateId, isLoading: true }));

    if (type === KANBAN_SELECTOR_MODE.TEMPLATES && settings) {
      yield sagaApplyFilter({ api }, { payload });
    }

    yield call([PageService, PageService.changeUrlLink], decodeLink(queryString.stringifyUrl(urlData)), { updateUrl: true });
  } catch (e) {
    console.error('[kanban/sagaSelectBoard saga] error', e);
  }
}

export function* sagaGetNextPage({ api }, { payload }) {
  try {
    const { stateId, isSkipPagination } = payload;

    const { canceled } = yield race({
      task: call(function* () {
        const { formProps, boardConfig, isLoading, totalCount } = yield select(selectKanban, stateId);

        if (!isLoading) {
          yield put(setLoading({ stateId, isLoading: true }));

          const { journalConfig, journalSetting } = yield select(selectJournalData, stateId);
          const pagination = yield select(selectPagination, stateId);

          const nextSkipCount = pagination.page * pagination.maxItems;

          if (!isSkipPagination) {
            pagination.skipCount = nextSkipCount;
            pagination.page += 1;

            yield put(setPagination({ stateId, pagination }));
          }

          if (totalCount > nextSkipCount) {
            yield sagaGetData(
              { api },
              {
                payload: {
                  stateId,
                  boardConfig,
                  journalSetting,
                  journalConfig,
                  formProps,
                  pagination,
                  isHandlePagination: isSkipPagination
                }
              }
            );
          }
        }

        yield put(setLoading({ stateId, isLoading: false }));
      }),
      canceled: take(cancelGetNextBoardPage().type)
    });

    if (canceled) {
      yield put(setLoading({ stateId, isLoading: false }));
    }
  } catch (e) {
    console.error('[kanban/sagaGetNextPage saga] error', e);
  }
}

export function* sagaRunAction({ api }, { payload }) {
  try {
    const { recordRef, action, stateId } = payload;

    const result = yield call([RecordActions, RecordActions.execForRecord], recordRef, action);

    if (!result) {
      return;
    }

    if (action && (action.type === 'view' || action.type === 'edit')) {
      yield put(refreshCardData({ stateId, recordRef, actionType: action.type }));
    } else {
      yield put(reloadBoardData({ stateId }));
    }
  } catch (e) {
    console.error('[kanban/sagaRunAction saga] error', e);
  }
}

function* reloadColumns({ api, stateId, boardConfig, columnIds }) {
  const { formProps } = yield select(selectKanban, stateId);
  const { journalConfig, journalSetting } = yield select(selectJournalData, stateId);
  const { dataCards: currentDataCards } = yield select(selectKanban, stateId);

  const params = getGridParams({ journalConfig, journalSetting, pagination: DEFAULT_PAGINATION });
  const { attrMap, inputByKey } = buildCardAttrMap(formProps, boardConfig);

  delete params.columns;
  delete params.groupBy;
  delete params.groupActions;
  delete params.attributes;
  params.attributes = attrMap;

  const predicates = ParserPredicate.replacePredicatesType(JournalsConverter.cleanUpPredicate(params.predicates));

  const urlProps = getSearchParams();
  const searchText = urlProps[JournalUrlParams.SEARCH];
  const searchPredicate = isExistValue(searchText)
    ? ParserPredicate.getSearchPredicates({
        text: searchText,
        columns: ParserPredicate.getAvailableSearchColumns(journalSetting.columns)
      })
    : [];

  const journalColumns = cloneDeep(journalConfig.columns);
  const columns = get(journalSetting, 'kanban.columns') || boardConfig.columns || [];

  const updatedDataCards = currentDataCards.map(col => ({ ...col }));

  yield all(
    columnIds.map(function* (columnId) {
      const colIndex = columns.findIndex(c => c.id === columnId);
      if (colIndex === -1) return;

      const column = columns[colIndex];
      const colPredicate = KanbanConverter.preparePredicate(column);
      const statusModifiedPredicate = KanbanConverter.getStatusModifiedPredicate(column);

      const settings = JournalsConverter.getSettingsForDataLoaderServer({
        ...params,
        predicates: [...predicates, colPredicate, statusModifiedPredicate],
        searchPredicate
      });

      const res = yield call(
        [JournalsService, JournalsService.getJournalData],
        journalConfig,
        { ...settings, columns: journalColumns }
      );

      const records = processCardRecords(res.records, inputByKey, boardConfig);
      updatedDataCards[colIndex] = { ...updatedDataCards[colIndex], records, totalCount: res.totalCount || 0 };
    })
  );

  const kanbanColumnsIds = columns.length > 0 ? columns.map(col => col.id) : null;
  const totalCount = updatedDataCards
    .filter(column => (kanbanColumnsIds ? kanbanColumnsIds.includes(column.status) : true))
    .reduce((count, col) => count + get(col, 'totalCount', 0), 0);

  yield put(setDataCards({ stateId, dataCards: updatedDataCards }));
  yield put(setTotalCount({ stateId, totalCount }));

  const newRecordRefs = updatedDataCards.map(cards => (cards.records || []).map(record => record.id));
  yield sagaGetActions({ api }, { payload: { boardConfig, newRecordRefs, stateId } });
}

function* reloadSwimlaneCells({ api, stateId, boardConfig, swimlaneGrouping, cells }) {
  const { formProps } = yield select(selectKanban, stateId);
  const { journalConfig, journalSetting } = yield select(selectJournalData, stateId);
  const columns = get(journalSetting, 'kanban.columns') || boardConfig.columns || [];

  yield all(
    cells.map(function* ({ swimlaneId, statusId }) {
      const column = columns.find(c => c.id === statusId);
      if (!column) return;

      const { queryParams, inputByKey } = yield call(buildSwimlaneCellQueryParams, {
        api, stateId, boardConfig, formProps, swimlaneGrouping, swimlaneId, journalConfig, journalSetting
      });

      const colPredicate = KanbanConverter.preparePredicate(column);
      const statusModifiedPredicate = KanbanConverter.getStatusModifiedPredicate(column);

      const settings = JournalsConverter.getSettingsForDataLoaderServer({
        ...queryParams.params,
        attributes: queryParams.attrMap,
        predicates: [...queryParams.predicates, colPredicate, queryParams.swimlaneAttrPredicate, statusModifiedPredicate],
        searchPredicate: queryParams.searchPredicate
      });

      const res = yield call(
        [JournalsService, JournalsService.getJournalData],
        journalConfig,
        { ...settings, columns: queryParams.journalColumns }
      );

      const records = processCardRecords(res.records, inputByKey, boardConfig);
      yield put(setSwimlaneCellData({ stateId, swimlaneId, statusId, records, totalCount: res.totalCount || 0 }));
    })
  );
}

export function* sagaMoveCard({ api }, { payload }) {
  let rollbackCards = [];
  try {
    const { stateId, cardIndex, fromColumnRef, toColumnRef } = payload;
    const { dataCards: prevDataCards = [], boardConfig = {} } = yield select(selectKanban, stateId);

    if (!boardConfig || isEmpty(boardConfig.columns)) {
      throw new Error('No columns in config?!');
    }

    const dataCards = cloneDeep(prevDataCards);
    rollbackCards = cloneDeep(prevDataCards);

    const fromColumnIndex = boardConfig.columns.findIndex(column => column.id === fromColumnRef);
    const toColumnIndex = boardConfig.columns.findIndex(column => column.id === toColumnRef);

    const fromColumnId = fromColumnIndex === -1 ? '' : boardConfig.columns[fromColumnIndex].id;
    const toColumnId = toColumnIndex === -1 ? '' : boardConfig.columns[toColumnIndex].id;

    yield put(setLoadingColumns({ stateId, isLoadingColumns: [fromColumnId, toColumnId] }));

    const deleted = dataCards[fromColumnIndex].records.splice(cardIndex, 1);
    dataCards[fromColumnIndex].totalCount -= 1;

    if (isEmpty(get(dataCards, [toColumnIndex, 'records']))) {
      set(dataCards, [toColumnIndex, 'records'], []);
      set(dataCards, [toColumnIndex, 'totalCount'], 0);
    }
    const card = get(deleted, [0], {});
    const recordRef = card.id || card.cardId;

    dataCards[toColumnIndex].records.unshift(card);
    dataCards[toColumnIndex].totalCount += 1;

    // Optimistic update for immediate visual feedback
    yield put(setDataCards({ stateId, dataCards }));

    const result = yield call(api.kanban.moveRecord, { recordRef, columnId: toColumnRef });

    if (get(result, 'id') !== recordRef) {
      throw new Error('Incorrect move result');
    }

    // Reload affected columns from server to get correct sorting
    yield call(reloadColumns, { api, stateId, boardConfig, columnIds: [fromColumnId, toColumnId] });
  } catch (e) {
    yield put(setDataCards({ stateId: payload.stateId, dataCards: rollbackCards }));
    NotificationManager.error(e.message || t('kanban.error.card-not-moved'), t('error'));
    console.error('[kanban/sagaRunAction saga] error', e);
  } finally {
    yield put(setLoadingColumns({ stateId: payload.stateId, isLoadingColumns: [] }));
  }
}

export function* sagaApplyFilter({ api }, { payload }) {
  try {
    const {
      settings: { predicate, kanban },
      stateId
    } = payload;
    const { journalConfig, journalSetting: _journalSetting, originGridSettings } = yield select(selectJournalData, stateId);
    const { formProps, boardConfig, swimlaneGrouping } = yield select(selectKanban, stateId);
    const pagination = DEFAULT_PAGINATION;
    const w = wrapArgs(stateId);
    const journalSetting = cloneDeep(_journalSetting);
    journalSetting.predicate = predicate;
    journalSetting.kanban = kanban;

    yield put(setPredicate(w(predicate)));
    yield put(setJournalSetting(w({ predicate, kanban })));
    yield put(setKanbanSettings({ stateId, kanbanSettings: kanban || {} }));
    yield put(setPagination({ stateId, pagination }));

    if (swimlaneGrouping) {
      yield sagaLoadSwimlaneValues({ api }, { payload: { stateId } });
    } else {
      yield sagaGetData({ api }, { payload: { stateId, boardConfig, journalSetting, journalConfig, formProps, pagination } });
    }

    const settings = {
      columns: get(originGridSettings, 'columnsSetup.columns'),
      sortBy: get(originGridSettings, 'columnsSetup.sortBy'),
      grouping: get(originGridSettings, 'grouping'),
      predicate
    };

    yield put(applyJournalSetting(w({ settings })));
    yield put(setLoading({ stateId, isLoading: false }));
  } catch (e) {
    console.error('[kanban/sagaApplyFilter saga] error', e);
  }
}

export function* sagaApplyPreset({ api }, { payload }) {
  try {
    const {
      settings: { predicate, kanban },
      stateId
    } = payload;
    const { journalConfig, journalSetting: _journalSetting } = yield select(selectJournalData, stateId);
    const { formProps, boardConfig, swimlaneGrouping } = yield select(selectKanban, stateId);
    const viewMode = yield select(selectViewMode, stateId);
    const pagination = DEFAULT_PAGINATION;
    const w = wrapArgs(stateId);

    const journalSetting = cloneDeep(_journalSetting);
    journalSetting.kanban = kanban;

    if (isKanban(viewMode)) {
      journalSetting.predicate = predicate;

      yield put(setPredicate(w(predicate)));
      yield put(setJournalSetting(w({ predicate, kanban })));
    }

    yield put(setKanbanSettings({ stateId, kanbanSettings: kanban || {} }));
    yield put(setPagination({ stateId, pagination }));

    if (swimlaneGrouping) {
      yield sagaLoadSwimlaneValues({ api }, { payload: { stateId } });
    } else {
      yield sagaGetData({ api }, { payload: { stateId, boardConfig, journalSetting, journalConfig, formProps, pagination } });
    }

    yield put(setLoading({ stateId, isLoading: false }));
  } catch (e) {
    console.error('[kanban/sagaApplyPreset saga] error', e);
  }
}

export function* sagaSetDefaultBoardAndTemplate({ api }, { payload }) {
  try {
    const { stateId, boardId, templateId } = payload;
    yield call(sagaSelectFromUrl, { api }, { payload: { stateId, boardId } });

    const kanbanProps = yield select(selectKanbanPageProps, stateId);
    const { templateList } = kanbanProps;
    const template = templateList.find(template => template.id === templateId);

    if (template) {
      yield call(
        sagaSelectFromUrl,
        { api },
        {
          payload: {
            templateId,
            settings: template.settings,
            stateId,
            type: KANBAN_SELECTOR_MODE.TEMPLATES
          }
        }
      );
    }
  } catch (e) {
    console.error('[kanban/sagaSetDefaultBoardAndTemplate saga error', e);
  }
}

export function* sagaResetFilter({ api }, { payload }) {
  try {
    const { stateId } = payload;
    const settings = yield select(selectSettingsData, stateId);
    const predicate = get(settings, 'originGridSettings.predicate', {});

    yield sagaApplyFilter({ api }, { payload: { stateId, settings: { predicate } } });
    yield put(setIsFiltered({ stateId, isFiltered: false }));
  } catch (e) {
    console.error('[kanban/sagaResetFilter saga error', e);
  }
}

export function* sagaRunSearchCard({ api }, { payload }) {
  try {
    const urlData = queryString.parseUrl(getUrlWithoutOrigin());
    const { text, stateId } = payload;
    const searchText = text || undefined;

    yield put(runSearch({ stateId, text: searchText }));

    if (get(urlData, ['query', JournalUrlParams.SEARCH]) !== searchText) {
      set(urlData, ['query', JournalUrlParams.SEARCH], searchText);
    }

    if (!isEqual(getSearchParams(), urlData.query)) {
      yield call([PageService, PageService.changeUrlLink], decodeLink(queryString.stringifyUrl(urlData)), { updateUrl: true });
    }
  } catch (e) {
    console.error('[kanban/sagaRunSearchCard saga error', e);
  }
}

export function* sagaSetSwimlaneGrouping({ api }, { payload }) {
  try {
    const { stateId, swimlaneGrouping } = payload;

    if (!swimlaneGrouping || !swimlaneGrouping.attribute) {
      yield put(setSwimlaneGrouping({ stateId, swimlaneGrouping: null }));
      yield sagaReloadBoardData({ api }, { payload: { stateId } });
      return;
    }

    yield put(setSwimlaneGrouping({ stateId, swimlaneGrouping }));
    yield sagaLoadSwimlaneValues({ api }, { payload: { stateId } });
  } catch (e) {
    console.error('[kanban/sagaSetSwimlaneGrouping saga] error', e);
  }
}

export function* sagaLoadSwimlaneValues({ api }, { payload }) {
  try {
    const { stateId } = payload;
    const { boardConfig, formProps, swimlaneGrouping } = yield select(selectKanban, stateId);

    if (!swimlaneGrouping || !swimlaneGrouping.attribute) {
      return;
    }

    const { journalConfig, journalSetting } = yield select(selectJournalData, stateId);
    const params = yield getGridParams({ journalConfig, journalSetting, pagination: DEFAULT_PAGINATION });
    const predicates = ParserPredicate.replacePredicatesType(JournalsConverter.cleanUpPredicate(params.predicates));
    const sourceId = journalConfig.sourceId;

    const urlProps = getSearchParams();
    const searchText = urlProps[JournalUrlParams.SEARCH];
    const searchPredicate = isExistValue(searchText)
      ? ParserPredicate.getSearchPredicates({
          text: searchText,
          columns: ParserPredicate.getAvailableSearchColumns(journalSetting.columns)
        })
      : [];

    const allPredicates = [...predicates];
    if (searchPredicate && searchPredicate.length) {
      allPredicates.push(...(Array.isArray(searchPredicate) ? searchPredicate : [searchPredicate]));
    }

    const distinctValues = yield call(api.kanban.getDistinctValues, {
      sourceId,
      attribute: swimlaneGrouping.attribute,
      predicates: allPredicates,
      workspaces: [getWorkspaceId()]
    });

    const sortedValues = KanbanConverter.prepareSwimlaneValues(distinctValues);

    // Extract color map from journal column formatter if available
    const swimlaneColumn = (journalConfig.columns || []).find(
      col => col.attribute === swimlaneGrouping.attribute || col.dataField === swimlaneGrouping.attribute
    );
    const formatterConfig = get(swimlaneColumn, 'newFormatter', {});
    const colorMap = formatterConfig.type === 'colored' ? get(formatterConfig, 'config.color', {}) : {};

    const columns = get(journalSetting, 'kanban.columns') || boardConfig.columns || [];
    const swimlanes = sortedValues.map(val => ({
      id: val.id,
      label: val.label,
      color: colorMap[val.id] || colorMap[val.label] || null,
      isCollapsed: false,
      cells: columns.reduce((acc, col) => {
        acc[col.id] = {
          records: [],
          totalCount: 0,
          pagination: { ...DEFAULT_PAGINATION },
          isLoading: true
        };
        return acc;
      }, {})
    }));

    yield put(setSwimlaneValues({ stateId, swimlanes }));

    yield all(
      swimlanes.map(sl =>
        call(sagaLoadSwimlaneCells, { api }, { payload: { stateId, swimlaneId: sl.id } })
      )
    );

    // Load actions for all swimlane records
    const updatedState = yield select(selectKanban, stateId);
    const newRecordRefs = collectRecordRefsFromSwimlanes(updatedState.swimlanes, columns);
    yield sagaGetActions({ api }, { payload: { boardConfig, newRecordRefs, stateId } });

    yield put(setLoading({ stateId, isLoading: false }));
  } catch (e) {
    yield put(setLoading({ stateId: payload.stateId, isLoading: false }));
    console.error('[kanban/sagaLoadSwimlaneValues saga] error', e);
  }
}

export function* sagaLoadSwimlaneCells({ api }, { payload }) {
  try {
    const { stateId, swimlaneId } = payload;
    const { boardConfig, formProps, swimlaneGrouping, swimlanes } = yield select(selectKanban, stateId);
    const { journalConfig, journalSetting } = yield select(selectJournalData, stateId);

    if (!swimlaneGrouping) {
      return;
    }

    const columns = get(journalSetting, 'kanban.columns') || boardConfig.columns || [];
    const { queryParams, inputByKey } = yield call(buildSwimlaneCellQueryParams, { api, stateId, boardConfig, formProps, swimlaneGrouping, swimlaneId, journalConfig, journalSetting });

    const swimlane = swimlanes.find(sl => sl.id === swimlaneId);

    yield all(
      columns.map(function* (column) {
        try {
          const colPredicate = KanbanConverter.preparePredicate(column);
          const statusModifiedPredicate = KanbanConverter.getStatusModifiedPredicate(column);
          const cellPagination = get(swimlane, ['cells', column.id, 'pagination'], DEFAULT_PAGINATION);

          const settings = JournalsConverter.getSettingsForDataLoaderServer({
            ...queryParams.params,
            attributes: queryParams.attrMap,
            predicates: [...queryParams.predicates, colPredicate, queryParams.swimlaneAttrPredicate, statusModifiedPredicate],
            searchPredicate: queryParams.searchPredicate
          });

          settings.pagination = cellPagination;

          const res = yield call(
            [JournalsService, JournalsService.getJournalData],
            journalConfig,
            { ...settings, columns: queryParams.journalColumns }
          );

          const records = processCardRecords(res.records, inputByKey, boardConfig);

          yield put(setSwimlaneCellData({
            stateId,
            swimlaneId,
            statusId: column.id,
            records,
            totalCount: res.totalCount || 0
          }));
        } catch (e) {
          yield put(setSwimlaneCellData({
            stateId,
            swimlaneId,
            statusId: column.id,
            records: [],
            totalCount: 0,
            error: e.message
          }));
          console.error('[kanban/sagaLoadSwimlaneCells saga] cell error', e);
        }
      })
    );
  } catch (e) {
    console.error('[kanban/sagaLoadSwimlaneCells saga] error', e);
  }
}

export function* sagaLoadMoreSwimlaneCell({ api }, { payload }) {
  const { stateId, swimlaneId, statusId } = payload;
  let loadingStarted = false;

  try {
    const { boardConfig, formProps, swimlaneGrouping, swimlanes } = yield select(selectKanban, stateId);
    const { journalConfig, journalSetting } = yield select(selectJournalData, stateId);

    if (!swimlaneGrouping) {
      return;
    }

    const swimlane = swimlanes.find(sl => sl.id === swimlaneId);
    const cell = get(swimlane, ['cells', statusId]);

    if (!cell) {
      return;
    }

    const columns = get(journalSetting, 'kanban.columns') || boardConfig.columns || [];
    const column = columns.find(c => c.id === statusId);

    if (!column) {
      return;
    }

    yield put(setSwimlaneCellLoading({ stateId, swimlaneId, statusId, isLoading: true }));
    loadingStarted = true;

    const { queryParams, inputByKey } = yield call(buildSwimlaneCellQueryParams, { api, stateId, boardConfig, formProps, swimlaneGrouping, swimlaneId, journalConfig, journalSetting });

    const colPredicate = KanbanConverter.preparePredicate(column);
    const statusModifiedPredicate = KanbanConverter.getStatusModifiedPredicate(column);

    const newPagination = {
      skipCount: cell.records.length,
      maxItems: DEFAULT_PAGINATION.maxItems,
      page: cell.pagination.page + 1
    };

    const settings = JournalsConverter.getSettingsForDataLoaderServer({
      ...queryParams.params,
      attributes: queryParams.attrMap,
      predicates: [...queryParams.predicates, colPredicate, queryParams.swimlaneAttrPredicate, statusModifiedPredicate],
      searchPredicate: queryParams.searchPredicate
    });

    settings.pagination = newPagination;

    const res = yield call(
      [JournalsService, JournalsService.getJournalData],
      journalConfig,
      { ...settings, columns: queryParams.journalColumns }
    );

    const newRecords = processCardRecords(res.records, inputByKey, boardConfig);
    const allRecords = [...cell.records, ...newRecords];

    yield put(setSwimlaneCellData({
      stateId,
      swimlaneId,
      statusId,
      records: allRecords,
      totalCount: res.totalCount || cell.totalCount
    }));
  } catch (e) {
    console.error('[kanban/sagaLoadMoreSwimlaneCell saga] error', e);
  } finally {
    if (loadingStarted) {
      yield put(setSwimlaneCellLoading({ stateId, swimlaneId, statusId, isLoading: false }));
    }
  }
}

export function* sagaMoveSwimlaneCard({ api }, { payload }) {
  let rollbackFromCell = null;
  let rollbackToCell = null;

  try {
    const { stateId, cardIndex, fromSwimlaneId, fromStatusId, toStatusId } = payload;
    const { swimlanes, boardConfig } = yield select(selectKanban, stateId);

    if (fromStatusId === toStatusId) {
      return;
    }

    const swimlane = swimlanes.find(sl => sl.id === fromSwimlaneId);

    if (!swimlane) {
      return;
    }

    const fromCell = swimlane.cells[fromStatusId];
    const toCell = swimlane.cells[toStatusId];

    if (!fromCell || !fromCell.records[cardIndex]) {
      return;
    }

    // Save state for rollback
    rollbackFromCell = { records: [...fromCell.records], totalCount: fromCell.totalCount };
    rollbackToCell = toCell ? { records: [...toCell.records], totalCount: toCell.totalCount } : { records: [], totalCount: 0 };

    const card = fromCell.records[cardIndex];
    const recordRef = card.id || card.cardId;
    const swimlaneId = fromSwimlaneId;

    // Optimistic update: remove from source cell, add to target cell
    const newFromRecords = [...fromCell.records];
    newFromRecords.splice(cardIndex, 1);
    yield put(setSwimlaneCellData({
      stateId,
      swimlaneId,
      statusId: fromStatusId,
      records: newFromRecords,
      totalCount: fromCell.totalCount - 1
    }));

    const newToRecords = [card, ...(toCell ? toCell.records : [])];
    yield put(setSwimlaneCellData({
      stateId,
      swimlaneId,
      statusId: toStatusId,
      records: newToRecords,
      totalCount: (toCell ? toCell.totalCount : 0) + 1
    }));

    const result = yield call(api.kanban.moveRecord, { recordRef, columnId: toStatusId });

    if (get(result, 'id') !== recordRef) {
      throw new Error('Incorrect move result');
    }

    // Reload swimlane cells from server to get correct sorting
    yield call(sagaLoadSwimlaneCells, { api }, { payload: { stateId, swimlaneId } });
  } catch (e) {
    // Rollback: restore previous cell state
    const { stateId, fromSwimlaneId, fromStatusId, toStatusId } = payload;
    const swimlaneId = fromSwimlaneId;

    if (rollbackFromCell) {
      yield put(setSwimlaneCellData({
        stateId,
        swimlaneId,
        statusId: fromStatusId,
        records: rollbackFromCell.records,
        totalCount: rollbackFromCell.totalCount
      }));
    }

    if (rollbackToCell) {
      yield put(setSwimlaneCellData({
        stateId,
        swimlaneId,
        statusId: toStatusId,
        records: rollbackToCell.records,
        totalCount: rollbackToCell.totalCount
      }));
    }

    NotificationManager.error(e.message || t('kanban.error.card-not-moved'), t('error'));
    console.error('[kanban/sagaMoveSwimlaneCard saga] error', e);
  }
}

function* refreshSwimlaneCard({ stateId, recordRef, newCardData, newStatus, swimlanes, swimlaneGrouping, columns, recordData }) {
  const location = findCardInSwimlanes(swimlanes, recordRef);
  if (!location) {
    return false;
  }

  const { swimlaneId: oldSwimlaneId, statusId: oldStatusId } = location;

  const targetColumn = columns.find(col => col.id === newStatus);
  const targetStatusId = targetColumn ? targetColumn.id : oldStatusId;

  let targetSwimlaneId = oldSwimlaneId;
  if (swimlaneGrouping.attribute) {
    const newSwimlaneValue = recordData._swimlaneValue || '';
    const matchingSwimlane = swimlanes.find(sl => sl.id === newSwimlaneValue);
    if (matchingSwimlane) {
      targetSwimlaneId = matchingSwimlane.id;
    } else if (newSwimlaneValue === '' || newSwimlaneValue === null) {
      const unassigned = swimlanes.find(sl => sl.id === '__unassigned__');
      if (unassigned) targetSwimlaneId = unassigned.id;
    } else {
      return false;
    }
  }

  if (oldSwimlaneId === targetSwimlaneId && oldStatusId === targetStatusId) {
    const swimlane = swimlanes.find(sl => sl.id === oldSwimlaneId);
    const cell = swimlane.cells[oldStatusId];
    const updatedRecords = cell.records.map(r =>
      (r.id === recordRef || r.cardId === recordRef) ? { ...r, ...newCardData } : r
    );
    yield put(setSwimlaneCellData({ stateId, swimlaneId: oldSwimlaneId, statusId: oldStatusId, records: updatedRecords, totalCount: cell.totalCount }));
  } else {
    const oldSwimlane = swimlanes.find(sl => sl.id === oldSwimlaneId);
    const oldCell = oldSwimlane.cells[oldStatusId];
    const filteredRecords = oldCell.records.filter(r => r.id !== recordRef && r.cardId !== recordRef);
    yield put(setSwimlaneCellData({ stateId, swimlaneId: oldSwimlaneId, statusId: oldStatusId, records: filteredRecords, totalCount: Math.max(0, oldCell.totalCount - 1) }));

    const targetSwimlane = swimlanes.find(sl => sl.id === targetSwimlaneId);
    if (!targetSwimlane || !targetSwimlane.cells[targetStatusId]) {
      return false;
    }
    const targetCell = targetSwimlane.cells[targetStatusId];
    yield put(setSwimlaneCellData({ stateId, swimlaneId: targetSwimlaneId, statusId: targetStatusId, records: [newCardData, ...targetCell.records], totalCount: targetCell.totalCount + 1 }));
  }

  return true;
}

function* refreshFlatCard({ stateId, recordRef, newCardData, newStatus, dataCards, columns }) {
  const location = findCardInDataCards(dataCards, recordRef);
  if (!location) {
    return false;
  }

  const { columnIndex: oldColumnIndex, cardIndex: cardIndexInColumn } = location;
  const targetColumnIndex = columns.findIndex(col => col.id === newStatus);
  const effectiveTargetIndex = targetColumnIndex >= 0 ? targetColumnIndex : oldColumnIndex;

  const updatedDataCards = dataCards.map(col => ({ ...col, records: [...col.records] }));

  if (oldColumnIndex === effectiveTargetIndex) {
    updatedDataCards[oldColumnIndex].records[cardIndexInColumn] = {
      ...updatedDataCards[oldColumnIndex].records[cardIndexInColumn],
      ...newCardData
    };
  } else {
    updatedDataCards[oldColumnIndex].records.splice(cardIndexInColumn, 1);
    updatedDataCards[oldColumnIndex].totalCount = Math.max(0, updatedDataCards[oldColumnIndex].totalCount - 1);

    if (!updatedDataCards[effectiveTargetIndex]) {
      updatedDataCards[effectiveTargetIndex] = { records: [], totalCount: 0, status: columns[effectiveTargetIndex].id };
    }
    updatedDataCards[effectiveTargetIndex].records.unshift(newCardData);
    updatedDataCards[effectiveTargetIndex].totalCount += 1;
  }

  yield put(setDataCards({ stateId, dataCards: updatedDataCards }));

  const kanbanColumnsIds = columns.length > 0 ? columns.map(col => col.id) : null;
  const totalCount = updatedDataCards
    .filter(column => (kanbanColumnsIds ? kanbanColumnsIds.includes(column.status) : true))
    .reduce((count, col) => count + get(col, 'totalCount', 0), 0);
  yield put(setTotalCount({ stateId, totalCount }));

  return true;
}

export function* sagaRefreshCard({ api }, { payload }) {
  try {
    const { stateId, recordRef, actionType } = payload;
    const { boardConfig, formProps, dataCards, swimlaneGrouping, swimlanes } = yield select(selectKanban, stateId);
    const columns = get(boardConfig, 'columns', []);

    if (!boardConfig || isEmpty(columns)) {
      yield put(reloadBoardData({ stateId }));
      return;
    }

    const { attrMap, inputByKey } = buildCardAttrMap(formProps, boardConfig);
    attrMap['_status'] = '_status?id';

    if (swimlaneGrouping && swimlaneGrouping.attribute) {
      attrMap['_swimlaneValue'] = swimlaneGrouping.attribute + '?str';
    }

    const record = Records.get(recordRef);
    const recordData = yield call([record, record.load], attrMap);

    if (!recordData) {
      yield put(reloadBoardData({ stateId }));
      return;
    }

    let newCardData = EcosFormUtils.postProcessingAttrsData({ recordData: { ...recordData, id: recordRef }, inputByKey });
    newCardData.id = recordRef;
    newCardData.cardId = recordData.cardId || recordRef;
    if (recordData.cardTitle !== undefined) newCardData.cardTitle = recordData.cardTitle;
    if (recordData.cardSubtitle !== undefined) newCardData.cardSubtitle = recordData.cardSubtitle;
    if (recordData._colorAttrValue !== undefined) newCardData._colorAttrValue = recordData._colorAttrValue;

    if (boardConfig.cardTitleTemplate) {
      newCardData.cardTitle = EcosFormUtils.renderByTemplate(boardConfig.cardTitleTemplate, newCardData);
    }

    const newStatus = recordData._status || '';
    let success;

    if (swimlaneGrouping && swimlanes && swimlanes.length > 0) {
      success = yield* refreshSwimlaneCard({ stateId, recordRef, newCardData, newStatus, swimlanes, swimlaneGrouping, columns, recordData });
    } else {
      success = yield* refreshFlatCard({ stateId, recordRef, newCardData, newStatus, dataCards, columns });
    }

    if (!success) {
      yield put(reloadBoardData({ stateId }));
      return;
    }

    // Silent reload after edit to get correct sort order from server
    if (actionType === 'edit') {
      try {
        if (swimlaneGrouping && swimlanes && swimlanes.length > 0) {
          const oldLocation = findCardInSwimlanes(swimlanes, recordRef);
          const cellsToReload = [];

          if (oldLocation) {
            cellsToReload.push({ swimlaneId: oldLocation.swimlaneId, statusId: oldLocation.statusId });

            const targetColumn = columns.find(col => col.id === newStatus);
            const targetStatusId = targetColumn ? targetColumn.id : oldLocation.statusId;

            const newSwimlaneValue = recordData._swimlaneValue || '';
            let targetSwimlaneId = oldLocation.swimlaneId;
            const matchingSwimlane = swimlanes.find(sl => sl.id === newSwimlaneValue);
            if (matchingSwimlane) {
              targetSwimlaneId = matchingSwimlane.id;
            } else if (newSwimlaneValue === '') {
              const unassigned = swimlanes.find(sl => sl.id === '__unassigned__');
              if (unassigned) targetSwimlaneId = unassigned.id;
            }

            if (oldLocation.swimlaneId !== targetSwimlaneId || oldLocation.statusId !== targetStatusId) {
              cellsToReload.push({ swimlaneId: targetSwimlaneId, statusId: targetStatusId });
            }
          }

          if (cellsToReload.length > 0) {
            yield call(reloadSwimlaneCells, { api, stateId, boardConfig, swimlaneGrouping, cells: cellsToReload });
          }
        } else {
          const oldLocation = findCardInDataCards(dataCards, recordRef);
          const columnIdsToReload = new Set();

          if (oldLocation) {
            columnIdsToReload.add(columns[oldLocation.columnIndex].id);
          }

          const targetColumn = columns.find(col => col.id === newStatus);
          if (targetColumn) {
            columnIdsToReload.add(targetColumn.id);
          }

          if (columnIdsToReload.size > 0) {
            yield call(reloadColumns, { api, stateId, boardConfig, columnIds: [...columnIdsToReload] });
          }
        }
      } catch (e) {
        console.error('[kanban/sagaRefreshCard] silent reload after edit error', e);
      }
    }

    // Refresh actions for the updated card
    const updatedState = yield select(selectKanban, stateId);
    const newRecordRefs = swimlaneGrouping
      ? collectRecordRefsFromSwimlanes(updatedState.swimlanes, columns)
      : (updatedState.dataCards || []).map(cards => (cards.records || []).map(record => record.id));

    yield sagaGetActions({ api }, { payload: { boardConfig, newRecordRefs, stateId } });
  } catch (e) {
    console.error('[kanban/sagaRefreshCard saga] error', e);
    yield put(reloadBoardData({ stateId: payload.stateId }));
  }
}

export function* sagaReloadBoardData({ api }, { payload }) {
  try {
    const { stateId } = payload;
    yield put(setLoading({ stateId, isLoading: true }));

    const pagination = DEFAULT_PAGINATION;
    yield put(setPagination({ stateId, pagination }));

    const { boardConfig, formProps, swimlaneGrouping } = yield select(selectKanban, stateId);
    const { journalConfig, journalSetting } = yield select(selectJournalData, stateId);

    if (swimlaneGrouping) {
      yield sagaLoadSwimlaneValues({ api }, { payload: { stateId } });
    } else {
      yield sagaGetData({ api }, { payload: { stateId, boardConfig, journalSetting, journalConfig, formProps, pagination } });
      yield put(setLoading({ stateId, isLoading: false }));
    }
  } catch (e) {
    console.error('[kanban/sagaReloadBoardData saga error', e);
  }
}

export function* docStatusSaga(ea) {
  yield takeEvery(getBoardList().type, sagaGetBoardList, ea);
  yield takeEvery(getBoardConfig().type, sagaGetBoardConfig, ea);
  yield takeEvery(getBoardData().type, sagaGetBoardData, ea);
  yield takeEvery(setDefaultBoardAndTemplate().type, sagaSetDefaultBoardAndTemplate, ea);
  yield takeEvery(selectBoardId().type, sagaSelectFromUrl, ea);
  yield takeEvery(selectTemplateId().type, sagaSelectFromUrl, ea);
  yield takeEvery(getNextPage().type, sagaGetNextPage, ea);
  yield takeEvery(runAction().type, sagaRunAction, ea);
  yield takeEvery(moveCard().type, sagaMoveCard, ea);
  yield takeEvery(applyFilter().type, sagaApplyFilter, ea);
  yield takeEvery(applyPreset().type, sagaApplyPreset, ea);
  yield takeEvery(resetFilter().type, sagaResetFilter, ea);
  yield takeEvery(runSearchCard().type, sagaRunSearchCard, ea);
  yield takeEvery(reloadBoardData().type, sagaReloadBoardData, ea);
  yield takeLatest(changeSwimlaneGrouping().type, sagaSetSwimlaneGrouping, ea);
  yield takeEvery(loadMoreSwimlaneCell().type, sagaLoadMoreSwimlaneCell, ea);
  yield takeEvery(moveSwimlaneCard().type, sagaMoveSwimlaneCard, ea);
  yield takeEvery(refreshCardData().type, sagaRefreshCard, ea);
  yield takeEvery(execRecordsActionComplete().type, wrapSaga, { ...ea, saga: sagaRecordActionComplete });
}

export default docStatusSaga;
