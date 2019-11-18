import { call, put, takeEvery } from 'redux-saga/effects';
import { backExecuteAction, getActions, runExecuteAction, setActions } from '../actions/recordActions';
import { setNotificationMessage } from '../actions/notification';
import { t } from '../helpers/util';

function* sagaGetActions({ api, logger }, { payload }) {
  try {
    const { record, stateId, context } = payload;
    const res = yield call(api.recordActions.getActions, { records: record, context }) || [];

    yield put(setActions({ stateId, list: res }));
  } catch (e) {
    logger.error('[tasks/sagaGetActions saga] error', e.message);
  }
}

function* sagaExecuteAction({ api, logger }, { payload }) {
  try {
    const { record, action, stateId } = payload;

    yield put(backExecuteAction({ stateId })); //todo перенести после выполнения действия после доработки сервиса

    const res = yield call(api.recordActions.executeAction, { records: record, action });

    if (res === null) {
      yield put(setNotificationMessage(t('records-actions.action-failed')));
    }
  } catch (e) {
    yield put(setNotificationMessage(t('records-actions.action-failed')));
    logger.error('[tasks/sagaExecuteAction saga] error', e.message);
  }
}

function* recordActions(ea) {
  yield takeEvery(getActions().type, sagaGetActions, ea);
  yield takeEvery(runExecuteAction().type, sagaExecuteAction, ea);
}

export default recordActions;
