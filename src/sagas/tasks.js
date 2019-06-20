import { put, takeLatest, call, select } from 'redux-saga/effects';
import { setDashletConfig, getDashletConfig, saveDashletConfig, setSaveTaskResult } from '../actions/tasks';
import { setNotificationMessage } from '../actions/notification';
import { t } from '../helpers/util';

function* sagaGetTasks({ api, logger }, { payload }) {
  const err = t('Ошибка получения данные');

  try {
    const { sourceId, recordRef } = payload;
    const res = yield call(api.tasks.getTasks, { sourceId, recordRef });

    if (res && Object.keys(res)) {
      yield put(setDashletConfig(res.records));
    } else {
      yield put(setNotificationMessage(err));
    }
  } catch (e) {
    yield put(setNotificationMessage(err));
    logger.error('[tasks/sagaGetTasks saga] error', e.message);
  }
}

function* sagaChangeAssigneeTask({ api, logger }, { payload }) {
  const err = t('Ошибка изменения исполнителя');

  try {
    const { taskId, sourceId, recordRef } = payload;
    const res = yield call(api.tasks.changeAssigneeTask, { taskId, sourceId, recordRef });

    if (res && Object.keys(res)) {
      yield put(
        setSaveTaskResult({
          status: res ? 'SUCCESS' : 'FAILURE',
          taskId: res.id
        })
      );
    } else {
      yield put(setNotificationMessage(err));
    }
  } catch (e) {
    yield put(setNotificationMessage(err));
    logger.error('[tasks/sagaChangeAssigneeTask saga] error', e.message);
  }
}

function* tasksSaga(ea) {
  yield takeLatest(getDashletConfig().type, sagaGetTasks, ea);
  yield takeLatest(saveDashletConfig().type, sagaGetTasks, ea);
}

export default tasksSaga;
