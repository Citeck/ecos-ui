import { call, put, takeEvery } from 'redux-saga/effects';
import isEmpty from 'lodash/isEmpty';

import { backPageFromTransitionsHistory } from '../actions/app';
import { backExecuteAction, getActions, runExecuteAction, setActions } from '../actions/recordActions';
import { setNotificationMessage } from '../actions/notification';
import { t } from '../helpers/util';
import { ActionTypes } from '../components/Records/actions';

function* sagaGetActions({ api, logger }, { payload }) {
  try {
    const { record, stateId, context } = payload;
    let list = yield call(api.recordActions.getActions, { records: record, context });

    if (isEmpty(list)) {
      list = [];
    }

    yield put(setActions({ stateId, list }));
  } catch (e) {
    logger.error('[recordActions/sagaGetActions saga] error', e.message);
  }
}

function* sagaExecuteAction({ api, logger }, { payload }) {
  try {
    const { record, action, stateId } = payload;
    const res = yield call(api.recordActions.executeAction, { records: record, action });

    yield put(backExecuteAction({ stateId }));

    if (res === null) {
      yield put(setNotificationMessage(t('records-actions.action-failed')));
    }

    if (res === true && action.type === ActionTypes.DELETE) {
      yield put(backPageFromTransitionsHistory());
    }
  } catch (e) {
    yield put(setNotificationMessage(t('records-actions.action-failed')));
    logger.error('[recordActions/sagaExecuteAction saga] error', e.message);
  }
}

function* recordActions(ea) {
  yield takeEvery(getActions().type, sagaGetActions, ea);
  yield takeEvery(runExecuteAction().type, sagaExecuteAction, ea);
}

export default recordActions;
