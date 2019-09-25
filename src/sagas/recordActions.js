import { call, put, takeEvery } from 'redux-saga/effects';
import { backExecuteAction, getActions, runExecuteAction, setActions } from '../actions/recordActions';
import { setNotificationMessage } from '../actions/notification';
import { t } from '../helpers/util';
import RecordActionsConverter from '../dto/recordActions';

function* sagaGetActions({ api, logger }, { payload }) {
  try {
    const { record, stateId, context } = payload;
    const res = yield call(api.recordActions.getActions, { records: record, context }) || [];

    yield put(setActions({ stateId, list: RecordActionsConverter.getActionListForWeb(res) }));
  } catch (e) {
    logger.error('[tasks/sagaGetCurrentTasks saga] error', e.message);
  }
}

function* sagaExecuteAction({ api, logger }, { payload }) {
  try {
    const { record, action, stateId, context } = payload;

    yield put(backExecuteAction({ stateId })); //todo перенести после выполнения действия после доработки сервиса

    const res = yield call(api.recordActions.executeAction, { records: record, action, context });

    if (!res) {
      yield put(setNotificationMessage(t('records-actions.action-failed')));
    }
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
