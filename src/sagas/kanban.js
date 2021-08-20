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
  setTotalCount
} from '../actions/kanban';
import PageService from '../services/PageService';
import EcosFormUtils from '../components/EcosForm/EcosFormUtils';
import { selectJournalData } from '../selectors/journals';
import { emptyJournalConfig } from '../reducers/journals';
import { getGridParams, getJournalConfig, getJournalSetting, getJournalSettingFully } from './journals';
import { wrapArgs } from '../helpers/redux';
import JournalsConverter from '../dto/journals';
import { ParserPredicate } from '../components/Filters/predicates';
import JournalsService from '../components/Journals/service/journalsService';
import { selectBoardConfig, selectFormProps, selectPagination } from '../selectors/kanban';

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

    delete params.columns;
    delete params.groupBy;
    delete params.groupActions;
    params.columns = formProps.formFields;

    const predicates = ParserPredicate.replacePredicatesType(JournalsConverter.cleanUpPredicate(params.predicates));
    const settings = JournalsConverter.getSettingsForDataLoaderServer({ ...params, predicates });

    let totalCount = 0;
    const dataCards = yield boardConfig.columns.map(function*(col) {
      console.warn('todo col.predicate');
      const resultData = yield call([JournalsService, JournalsService.getJournalData], journalConfig, settings);
      totalCount += resultData.totalCount || 0;
      return resultData;
    });

    yield put(setTotalCount({ stateId, totalCount }));
    yield put(setDataCards({ stateId, dataCards }));
  } catch (e) {
    logger.error('[kanban/sagaGetBoardData saga] error', e.message);
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
    const formProps = yield select(selectFormProps, stateId);
    const boardConfig = yield select(selectBoardConfig, stateId);
    const { journalConfig, journalSetting } = yield select(selectJournalData, stateId);
    const pagination = yield select(selectPagination, stateId);
    pagination.page += 1;
    //todo накапливать данные ?
    yield sagaGetData({ api, logger }, { payload: { stateId, boardConfig, journalSetting, journalConfig, formProps, pagination } });
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
