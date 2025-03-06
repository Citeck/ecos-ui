import { call, put, takeEvery } from 'redux-saga/effects';
import isEmpty from 'lodash/isEmpty';
import { NotificationManager } from '@/services/notifications';

import { backPageFromTransitionsHistory } from '../actions/app';
import { backExecuteAction, getActions, runExecuteAction, setActions, setLoading } from '../actions/recordActions';
import { ActionTypes } from '../components/Records/actions/constants';
import { t } from '../helpers/util';

function notify(type, keyMsg) {
  NotificationManager[type](t(keyMsg), t('records-actions.notify.title'));
}

function* sagaGetActions({ api }, { payload }) {
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
    console.error('[recordActions/sagaGetActions saga] error', e);
  }
}

function* sagaExecuteAction({ api }, { payload }) {
  const { record, action, stateId } = payload;

  try {
    const res = yield call(api.recordActions.executeAction, { records: record, action });

    if (res === true) {
      yield put(setLoading({ stateId }));
    }

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
    console.error('[recordActions/sagaExecuteAction saga] error', e);
  }
}

function* recordActions(ea) {
  yield takeEvery(getActions().type, sagaGetActions, ea);
  yield takeEvery(runExecuteAction().type, sagaExecuteAction, ea);
}

export default recordActions;
