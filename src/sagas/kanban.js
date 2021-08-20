import { call, put, select, takeEvery } from 'redux-saga/effects';
import * as queryString from 'query-string';
import { NotificationManager } from 'react-notifications';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';
import get from 'lodash/get';
import set from 'lodash/set';
import cloneDeep from 'lodash/cloneDeep';

import { KanbanUrlParams } from '../constants';
import { decodeLink, getSearchParams, getUrlWithoutOrigin } from '../helpers/urls';
import { t } from '../helpers/export/util';
import {
  getBoardConfig,
  getBoardData,
  getBoardList,
  selectBoardId,
  setBoardConfig,
  setBoardList,
  setFormProps,
  setIsEnabled,
  setLoading
} from '../actions/kanban';
import { selectJournalInfo } from '../selectors/kanban';
import PageService from '../services/PageService';
import EcosFormUtils from '../components/EcosForm/EcosFormUtils';

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
    const { boardId, stateId } = payload;
    const boardConfig = yield sagaGetBoardConfig({ api, logger }, { payload });
    const formProps = yield sagaFormProps({ api, logger }, { payload: { formId: boardConfig.cardFormRef, stateId } });
    let journalInfo = yield select(selectJournalInfo, stateId);
    console.log(journalInfo);
    console.log();
    if (isEmpty(journalInfo)) {
      //todo use journal saga
    }

    // journalInfo = cloneDeep(journalInfo);
    // console.log(journal.config.columns);
    // delete journal.config.columns;
    // console.log({ journal, boardConfig });

    const params = {
      columns: formProps.formFields
    };

    // const resultData = yield call(api.kanban.getBoardData, {boardConfig, journalConfig: journal.config, params});
    // console.log({ resultData });

    yield put(setLoading({ stateId, isLoading: false }));
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

function* docStatusSaga(ea) {
  yield takeEvery(getBoardList().type, sagaGetBoardList, ea);
  yield takeEvery(getBoardConfig().type, sagaGetBoardConfig, ea);
  yield takeEvery(getBoardData().type, sagaGetBoardData, ea);
  yield takeEvery(selectBoardId().type, sagaSelectBoard, ea);
}

export default docStatusSaga;
