import { call, put, takeEvery } from 'redux-saga/effects';
import { backExecuteAction, getActions, runExecuteAction, setActions } from '../actions/recordActions';
import { setNotificationMessage } from '../actions/notification';
import { t } from '../helpers/util';
import RecordActionsConverter from '../dto/recordActions';

function* sagaGetActions({ api, logger }, { payload }) {
  try {
    const { record, dashboardId, stateId } = payload;
    const res = yield call(api.recordActions.getActions, { record, dashboardId });

    if (res && Object.keys(res)) {
      yield put(setActions({ stateId, list: RecordActionsConverter.getActionListForWeb(res) }));
    }
  } catch (e) {
    logger.error('[tasks/sagaGetCurrentTasks saga] error', e.message);
  }
}

function* sagaExecuteAction({ api, logger }, { payload }) {
  try {
    const { record, action, stateId } = payload;
    const res = yield call(api.recordActions.executeAction, { record, action });

    if (!res) {
      yield put(setNotificationMessage(t('records-actions.action-failed')));
    }
    yield put(backExecuteAction({ stateId }));
  } catch (e) {
    yield put(setNotificationMessage(t('records-actions.action-failed')));
    logger.error('[tasks/sagaGetCurrentTasks saga] error', e.message);
  }
}

function* recordActions(ea) {
  yield takeEvery(getActions().type, sagaGetActions, ea);
  yield takeEvery(runExecuteAction().type, sagaExecuteAction, ea);
}

export default recordActions;
