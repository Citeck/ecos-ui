import { call, put, takeEvery } from 'redux-saga/effects';
import isEmpty from 'lodash/isEmpty';
import { NotificationManager } from 'react-notifications';

import { backPageFromTransitionsHistory } from '../actions/app';
import { backExecuteAction, getActions, runExecuteAction, setActions } from '../actions/recordActions';
import { t } from '../helpers/util';
import { ActionTypes } from '../components/Records/actions';

function notify(type, keyMsg) {
  NotificationManager[type](t(keyMsg), t('records-actions.notify.title'));
}

function* sagaGetActions({ api, logger }, { payload }) {
  const { record, stateId, context } = payload;

  try {
    let list = yield call(api.recordActions.getActions, { records: record, context });

    if (isEmpty(list)) {
      list = [];
    }

    yield put(setActions({ stateId, list }));
  } catch (e) {
    yield put(setActions({ stateId, list: [] }));
    notify('error', 'records-actions.error.get-actions');
    logger.error('[recordActions/sagaGetActions saga] error', e.message);
  }
}

function* sagaExecuteAction({ api, logger }, { payload }) {
  const { record, action, stateId } = payload;

  try {
    const res = yield call(api.recordActions.executeAction, { records: record, action });

    yield put(backExecuteAction({ stateId }));

    if (res === null) {
      notify('warning', 'records-actions.error.execute-action');
    }

    if (res === true && action.type === ActionTypes.DELETE) {
      yield put(backPageFromTransitionsHistory());
    }
  } catch (e) {
    yield put(backExecuteAction({ stateId }));
    notify('error', 'records-actions.error.execute-action');
    logger.error('[recordActions/sagaExecuteAction saga] error', e.message);
  }
}

function* recordActions(ea) {
  yield takeEvery(getActions().type, sagaGetActions, ea);
  yield takeEvery(runExecuteAction().type, sagaExecuteAction, ea);
}

export default recordActions;
