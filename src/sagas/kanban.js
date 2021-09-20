import { call, put, select, takeEvery } from 'redux-saga/effects';
import * as queryString from 'query-string';
import { NotificationManager } from 'react-notifications';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';
import get from 'lodash/get';
import set from 'lodash/set';
import cloneDeep from 'lodash/cloneDeep';

import { JournalUrlParams, KanbanUrlParams } from '../constants';
import { decodeLink, getSearchParams, getUrlWithoutOrigin } from '../helpers/urls';
import { isExistValue } from '../helpers/util';
import { t } from '../helpers/export/util';
import { wrapArgs } from '../helpers/redux';
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
  setTotalCount
} from '../actions/kanban';
import { setJournalSetting, setPredicate } from '../actions/journals';
import { selectJournalData, selectSettingsData } from '../selectors/journals';
import { selectKanban, selectPagination } from '../selectors/kanban';
import { emptyJournalConfig } from '../reducers/journals';
import PageService from '../services/PageService';
import JournalsConverter from '../dto/journals';
import KanbanConverter from '../dto/kanban';
import RecordActions from '../components/Records/actions/recordActions';
import EcosFormUtils from '../components/EcosForm/EcosFormUtils';
import { ParserPredicate } from '../components/Filters/predicates';
import JournalsService from '../components/Journals/service/journalsService';
import { DEFAULT_PAGINATION } from '../components/Journals/constants';
import { getGridParams, getJournalConfig, getJournalSettingFully } from './journals';

export function* sagaGetBoardList({ api, logger }, { payload }) {
  try {
    const { journalId, stateId } = payload;
    const boardList = yield call(api.kanban.getBoardList, { journalId });
    const isEnabled = !isEmpty(boardList);

    yield put(setIsEnabled({ isEnabled, stateId }));

    if (isEnabled) {
      yield put(setBoardList({ boardList: KanbanConverter.prepareList(boardList), stateId }));
    }
  } catch (e) {
    logger.error('[kanban/sagaGetBoardList saga] error', e.message);
  }
}

export function* sagaGetBoardConfig({ api, logger }, { payload }) {
  try {
    const { boardId, stateId } = payload;
    const { boardDef, ...config } = yield call(api.kanban.getBoardConfig, { boardId });
    const boardConfig = KanbanConverter.prepareConfig(config);

    yield put(setBoardConfig({ boardConfig, stateId }));

    return boardConfig;
  } catch (e) {
    logger.error('[kanban/sagaGetBoardConfig saga] error', e.message);
  }
}

export function* sagaFormProps({ api, logger }, { payload: { stateId, formId } }) {
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
    logger.error('[kanban/sagaFormProps saga] error', e.message);
  }
}

export function* sagaGetBoardData({ api, logger }, { payload }) {
  try {
    const { stateId } = payload;
    const boardConfig = yield sagaGetBoardConfig({ api, logger }, { payload });
    const formProps = yield sagaFormProps({ api, logger }, { payload: { formId: boardConfig.cardFormRef, stateId } });
    let { journalConfig, journalSetting } = yield select(selectJournalData, stateId);

    if (!!boardConfig.journalRef && (isEmpty(journalConfig) || isEqual(journalConfig, emptyJournalConfig))) {
      const w = wrapArgs(stateId);
      journalConfig = yield getJournalConfig({ api, w, force: true }, boardConfig.journalRef);
      journalSetting = yield getJournalSettingFully(api, { journalConfig, stateId }, w);
    }

    const pagination = yield select(selectPagination, stateId);

    yield sagaGetData({ api, logger }, { payload: { stateId, boardConfig, journalSetting, journalConfig, formProps, pagination } });
    yield put(setLoading({ stateId, isLoading: false }));
  } catch (e) {
    logger.error('[kanban/sagaGetBoardData saga] error', e.message);
  }
}

export function* sagaGetData({ api, logger }, { payload }) {
  try {
    const { boardConfig = {}, journalConfig = {}, journalSetting = {}, formProps = {}, pagination = {}, stateId } = payload;
    const params = getGridParams({ journalConfig, journalSetting, pagination });
    const { dataCards: prevDataCards } = yield select(selectKanban, stateId);
    const urlProps = getSearchParams();
    const searchText = urlProps[JournalUrlParams.SEARCH];

    const _journalConfig = cloneDeep(journalConfig);

    delete params.columns;
    delete params.groupBy;
    delete params.groupActions;
    delete params.attributes;
    delete _journalConfig.columns;

    const { attributes, inputByKey } = EcosFormUtils.preProcessingAttrs(formProps.formFields);

    params.attributes = { ...attributes, ...KanbanConverter.getCardAttributes() };

    const predicates = ParserPredicate.replacePredicatesType(JournalsConverter.cleanUpPredicate(params.predicates));

    const searchPredicate = isExistValue(searchText)
      ? ParserPredicate.getSearchPredicates({
          text: searchText,
          columns: journalSetting.columns
        })
      : [];

    const result = yield (boardConfig.columns || []).map(function*(column, i) {
      if (get(prevDataCards, [i, 'records', 'length'], 0) === get(prevDataCards, [i, 'totalCount'])) {
        return yield {};
      }

      const colPredicate = KanbanConverter.preparePredicate(column);
      const settings = JournalsConverter.getSettingsForDataLoaderServer({
        ...params,
        predicates: [...predicates, colPredicate],
        searchPredicate
      });

      return yield call([JournalsService, JournalsService.getJournalData], _journalConfig, settings);
    });

    const dataCards = [];
    const newRecordRefs = [];

    result.forEach((data = {}, i) => {
      const prevRecords = get(prevDataCards, [i, 'records'], []);

      if (!data.records || data.error) {
        data.error && console.error('[kanban/sagaGetData saga] error column', data.error);
        dataCards.push({
          totalCount: get(prevDataCards, [i, 'totalCount'], 0),
          records: prevRecords,
          error: get(data, 'error.message')
        });
      } else {
        const preparedRecords = data.records.map(recordData => EcosFormUtils.postProcessingAttrsData({ recordData, inputByKey }));
        newRecordRefs.push(preparedRecords.map(rec => rec.cardId));
        dataCards.push({ totalCount: data.totalCount, records: [...prevRecords, ...preparedRecords] });
      }
    });

    const totalCount = dataCards.reduce((count, col) => count + get(col, 'totalCount', 0), 0);

    yield sagaGetActions({ api, logger }, { payload: { boardConfig, newRecordRefs, stateId } });
    yield put(setDataCards({ stateId, dataCards }));
    yield put(setTotalCount({ stateId, totalCount }));
  } catch (e) {
    logger.error('[kanban/sagaGetData saga] error', e.message);
  }
}

export function* sagaGetActions({ api, logger }, { payload }) {
  try {
    const { boardConfig = {}, newRecordRefs = [], stateId } = payload;
    const { resolvedActions: prevResolvedActions = [] } = yield select(selectKanban, stateId);

    const resolvedActions = yield (boardConfig.columns || []).map(function*(column, i) {
      const newResolvedActions = yield call([JournalsService, JournalsService.getRecordActions], boardConfig, newRecordRefs[i]);
      return { ...get(prevResolvedActions, [i], {}), ...newResolvedActions.forRecord };
    });

    yield put(setResolvedActions({ stateId, resolvedActions }));
  } catch (e) {
    logger.error('[kanban/sagaGetActions saga] error', e);
  }
}

export function* sagaSelectBoard({ api, logger }, { payload }) {
  try {
    const urlData = queryString.parseUrl(getUrlWithoutOrigin());
    const { boardId, stateId } = payload;

    if (boardId && get(urlData, ['query', KanbanUrlParams.BOARD_ID]) !== boardId) {
      set(urlData, ['query', KanbanUrlParams.BOARD_ID], boardId);
    }

    if (!isEqual(getSearchParams(), urlData.query)) {
      yield put(setLoading({ stateId, isLoading: true }));
      yield call(PageService.changeUrlLink, decodeLink(queryString.stringifyUrl(urlData)), { updateUrl: true });
    }
  } catch (e) {
    logger.error('[kanban/sagaSelectBoard saga] error', e);
  }
}

export function* sagaGetNextPage({ api, logger }, { payload }) {
  try {
    const { stateId } = payload;
    yield put(setLoading({ stateId, isLoading: true }));

    const { formProps, boardConfig } = yield select(selectKanban, stateId);
    const { journalConfig, journalSetting } = yield select(selectJournalData, stateId);
    const pagination = yield select(selectPagination, stateId);

    pagination.skipCount = pagination.page * pagination.maxItems;
    pagination.page += 1;

    yield put(setPagination({ stateId, pagination }));
    yield sagaGetData({ api, logger }, { payload: { stateId, boardConfig, journalSetting, journalConfig, formProps, pagination } });
    yield put(setLoading({ stateId, isLoading: false }));
  } catch (e) {
    logger.error('[kanban/sagaGetNextPage saga] error', e);
  }
}

export function* sagaRunAction({ api, logger }, { payload }) {
  try {
    const { recordRef, action } = payload;

    yield call([RecordActions, RecordActions.execForRecord], recordRef, action);
  } catch (e) {
    logger.error('[kanban/sagaRunAction saga] error', e);
  }
}

export function* sagaMoveCard({ api, logger }, { payload }) {
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

    yield put(setLoadingColumns({ stateId, isLoadingColumns: [fromColumnIndex, toColumnIndex] }));

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

    yield put(setDataCards({ stateId, dataCards }));
    const result = yield call(api.kanban.moveRecord, { recordRef, columnId: toColumnRef });

    if (get(result, 'id') !== recordRef) {
      throw new Error('Incorrect move result');
    }
  } catch (e) {
    yield put(setDataCards({ stateId: payload.stateId, dataCards: rollbackCards }));
    NotificationManager.error(t('kanban.error.card-not-moved'), t('error'));
    logger.error('[kanban/sagaRunAction saga] error', e);
  } finally {
    yield put(setLoadingColumns({ stateId: payload.stateId, isLoadingColumns: [] }));
  }
}

export function* sagaApplyFilter({ api, logger }, { payload }) {
  try {
    const {
      settings: { predicate },
      stateId
    } = payload;
    const { journalConfig, journalSetting: _journalSetting } = yield select(selectJournalData, stateId);
    const { formProps, boardConfig } = yield select(selectKanban, stateId);
    const pagination = DEFAULT_PAGINATION;
    const w = wrapArgs(stateId);
    const journalSetting = cloneDeep(_journalSetting);
    journalSetting.predicate = predicate;

    yield put(setPredicate(w(predicate)));
    yield put(setJournalSetting(w({ predicate })));
    yield put(setPagination({ stateId, pagination }));
    yield sagaGetData({ api, logger }, { payload: { stateId, boardConfig, journalSetting, journalConfig, formProps, pagination } });
    yield put(setLoading({ stateId, isLoading: false }));
  } catch (e) {
    logger.error('[kanban/sagaApplyFilter saga] error', e);
  }
}

export function* sagaResetFilter({ api, logger }, { payload }) {
  try {
    const { stateId } = payload;
    const settings = yield select(selectSettingsData, stateId);
    const predicate = get(settings, 'originGridSettings.predicate', {});

    yield sagaApplyFilter({ api, logger }, { payload: { stateId, settings: { predicate } } });
    yield put(setIsFiltered({ stateId, isFiltered: false }));
  } catch (e) {
    logger.error('[kanban/sagaResetFilter saga error', e);
  }
}

export function* sagaRunSearchCard({ api, logger }, { payload }) {
  try {
    const urlData = queryString.parseUrl(getUrlWithoutOrigin());
    const { text } = payload;
    const searchText = text || undefined;

    if (get(urlData, ['query', JournalUrlParams.SEARCH]) !== searchText) {
      set(urlData, ['query', JournalUrlParams.SEARCH], searchText);
    }

    if (!isEqual(getSearchParams(), urlData.query)) {
      yield call(PageService.changeUrlLink, decodeLink(queryString.stringifyUrl(urlData)), { updateUrl: true });
    }
  } catch (e) {
    logger.error('[kanban/sagaRunSearchCard saga error', e);
  }
}

export function* sagaReloadBoardData({ api, logger }, { payload }) {
  try {
    const { stateId } = payload;
    yield put(setLoading({ stateId, isLoading: true }));
    const { boardConfig, formProps, pagination } = yield select(selectKanban, stateId);
    const { journalConfig, journalSetting } = yield select(selectJournalData, stateId);

    yield sagaGetData({ api, logger }, { payload: { stateId, boardConfig, journalSetting, journalConfig, formProps, pagination } });
    yield put(setLoading({ stateId, isLoading: false }));
  } catch (e) {
    logger.error('[kanban/sagaRunSearchCard saga error', e);
  }
}

export function* docStatusSaga(ea) {
  yield takeEvery(getBoardList().type, sagaGetBoardList, ea);
  yield takeEvery(getBoardConfig().type, sagaGetBoardConfig, ea);
  yield takeEvery(getBoardData().type, sagaGetBoardData, ea);
  yield takeEvery(selectBoardId().type, sagaSelectBoard, ea);
  yield takeEvery(getNextPage().type, sagaGetNextPage, ea);
  yield takeEvery(runAction().type, sagaRunAction, ea);
  yield takeEvery(moveCard().type, sagaMoveCard, ea);
  yield takeEvery(applyFilter().type, sagaApplyFilter, ea);
  yield takeEvery(resetFilter().type, sagaResetFilter, ea);
  yield takeEvery(runSearchCard().type, sagaRunSearchCard, ea);
  yield takeEvery(reloadBoardData().type, sagaReloadBoardData, ea);
}

export default docStatusSaga;
