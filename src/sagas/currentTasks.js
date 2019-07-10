import { call, put, takeEvery } from 'redux-saga/effects';
import { getCurrentTaskList, setCurrentTaskList } from '../actions/tasks';
import { setNotificationMessage } from '../actions/notification';
import { t } from '../helpers/util';
import TasksConverter from '../dto/tasks';

function* sagaGetCurrentTasks({ api, logger }, { payload }) {
  const err = t('current-tasks-widget.saga.error1');

  try {
    const { document, stateId } = payload;
    const res = yield call(api.tasks.getCurrentTasksForUser, { document });

    if (res && Object.keys(res)) {
      yield put(setCurrentTaskList({ stateId, list: TasksConverter.getCurrentTaskListForWeb(res.records) }));
    } else {
      yield put(setNotificationMessage(err));
    }
  } catch (e) {
    yield put(setNotificationMessage(err));
    logger.error('[tasks/sagaGetCurrentTasks saga] error', e.message);
  }
}

function* tasksSaga(ea) {
  yield takeEvery(getCurrentTaskList().type, sagaGetCurrentTasks, ea);
}

export default tasksSaga;
