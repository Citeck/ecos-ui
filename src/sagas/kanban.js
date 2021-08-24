import { call, put, select, takeEvery } from 'redux-saga/effects';
import * as queryString from 'query-string';
import { NotificationManager } from 'react-notifications';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';
import get from 'lodash/get';
import set from 'lodash/set';

import { KanbanUrlParams } from '../constants';
import { decodeLink, getSearchParams, getUrlWithoutOrigin } from '../helpers/urls';
import { t } from '../helpers/export/util';
import { wrapArgs } from '../helpers/redux';
import {
  getBoardConfig,
  getBoardData,
  getBoardList,
  getNextPage,
  selectBoardId,
  setBoardConfig,
  setBoardList,
  setDataCards,
  setFormProps,
  setIsEnabled,
  setLoading,
  setPagination,
  setResolvedActions,
  setTotalCount
} from '../actions/kanban';
import { selectJournalData } from '../selectors/journals';
import { selectKanban, selectPagination } from '../selectors/kanban';
import { emptyJournalConfig } from '../reducers/journals';
import PageService from '../services/PageService';
import JournalsConverter from '../dto/journals';
import EcosFormUtils from '../components/EcosForm/EcosFormUtils';
import { ParserPredicate } from '../components/Filters/predicates';
import JournalsService from '../components/Journals/service/journalsService';
import { getGridParams, getJournalConfig, getJournalSettingFully } from './journals';

function* sagaGetBoardList({ api, logger }, { payload }) {
  try {
    const { journalId, stateId } = payload;
    const boardList = yield call(api.kanban.getBoardList, { journalId });
    const isEnabled = !isEmpty(boardList);

    yield put(setIsEnabled({ isEnabled, stateId }));

    if (isEnabled) {
      yield put(setBoardList({ boardList, stateId }));
    }
  } catch (e) {
    logger.error('[kanban/sagaGetBoardList saga] error', e.message);
  }
}

function* sagaGetBoardConfig({ api, logger }, { payload }) {
  try {
    const { boardId, stateId } = payload;
    const boardConfig = yield call(api.kanban.getBoardConfig, { boardId });

    //todo уточнение

    // const emptyCol = boardConfig.columns.find(col => col.id === 'EMPTY');
    //
    // if(!emptyCol) {
    //   boardConfig.columns.push({"t": "not-empty", "att":"_status" })
    // }

    yield put(setBoardConfig({ boardConfig, stateId }));

    return boardConfig;
  } catch (e) {
    logger.error('[kanban/sagaGetBoardConfig saga] error', e.message);
  }
}

function* sagaFormProps({ api, logger }, { payload: { stateId, formId } }) {
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

function* sagaGetBoardData({ api, logger }, { payload }) {
  try {
    const { stateId } = payload;
    const boardConfig = yield sagaGetBoardConfig({ api, logger }, { payload });
    const formProps = yield sagaFormProps({ api, logger }, { payload: { formId: boardConfig.cardFormRef, stateId } });
    let { journalConfig, journalSetting } = yield select(selectJournalData, stateId);

    if (isEmpty(journalConfig) || isEqual(journalConfig, emptyJournalConfig)) {
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

function* sagaGetData({ api, logger }, { payload }) {
  try {
    const { boardConfig, journalConfig, journalSetting, formProps, pagination, stateId } = payload;
    const params = getGridParams({ journalConfig, journalSetting, pagination });
    const { dataCards: prevDataCards } = yield select(selectKanban, stateId);

    delete params.columns;
    delete params.groupBy;
    delete params.groupActions;
    delete params.attributes;

    const { attributes, inputByKey } = EcosFormUtils.preProcessingAttrs(formProps.formFields);

    params.attributes = attributes;
    params.attributes.cardId = '.id';
    params.attributes.cardTitle = '.disp';

    const predicates = ParserPredicate.replacePredicatesType(JournalsConverter.cleanUpPredicate(params.predicates));

    const result = yield boardConfig.columns.map(function*(column, i) {
      if (get(prevDataCards, [i, 'records', 'length'], 0) === get(prevDataCards, [i, 'totalCount'])) {
        return yield {};
      }

      const settings = JournalsConverter.getSettingsForDataLoaderServer({ ...params, predicates: [...predicates, column.predicate] });
      return yield call([JournalsService, JournalsService.getJournalData], journalConfig, settings);
    });

    const dataCards = [];

    result.forEach((data = {}, i) => {
      const prevRecords = get(prevDataCards, [i, 'records'], []);

      if (!data.records || data.error) {
        dataCards.push({
          totalCount: get(prevDataCards, [i, 'totalCount'], 0),
          records: prevRecords,
          error: get(data, 'error.message')
        });
      } else {
        const preparedRecords = data.records.map(recordData => EcosFormUtils.postProcessingAttrsData({ recordData, inputByKey }));
        dataCards.push({ totalCount: data.totalCount, records: [...prevRecords, ...preparedRecords] });
      }
    });

    const totalCount = dataCards.reduce((count, col) => count + get(col, 'totalCount', 0), 0);

    yield sagaGetActions({ api, logger }, { payload: { boardConfig, dataCards, stateId } });

    yield put(setDataCards({ stateId, dataCards }));
    yield put(setTotalCount({ stateId, totalCount }));
  } catch (e) {
    logger.error('[kanban/sagaGetBoardData saga] error', e.message);
  }
}

function* sagaGetActions({ api, logger }, { payload }) {
  try {
    const { boardConfig, dataCards, stateId } = payload;

    const resolvedActions = yield boardConfig.columns.map(function*(column, i) {
      const records = get(dataCards, [i, 'records'], []);
      const recordRefs = records.map(rec => rec.cardId);

      return yield call([JournalsService, JournalsService.getRecordActions], boardConfig, recordRefs);
    });

    yield put(setResolvedActions({ stateId, resolvedActions }));
  } catch (e) {
    logger.error('[kanban/sagaGetActions saga] error', e);
  }
}

function* sagaSelectBoard({ api, logger }, { payload }) {
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

function* sagaGetNextPage({ api, logger }, { payload }) {
  try {
    const { stateId } = payload;

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

function* docStatusSaga(ea) {
  yield takeEvery(getBoardList().type, sagaGetBoardList, ea);
  yield takeEvery(getBoardConfig().type, sagaGetBoardConfig, ea);
  yield takeEvery(getBoardData().type, sagaGetBoardData, ea);
  yield takeEvery(selectBoardId().type, sagaSelectBoard, ea);
  yield takeEvery(getNextPage().type, sagaGetNextPage, ea);
}

export default docStatusSaga;
