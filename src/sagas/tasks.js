import { call, put, takeEvery } from 'redux-saga/effects';
import { changeTaskAssignee, getTaskList, setTaskAssignee, setTaskList } from '../actions/tasks';
import { setNotificationMessage } from '../actions/notification';
import { t } from '../helpers/util';
import TasksConverter from '../dto/tasks';
import TasksService from '../services/tasks';

function* sagaGetTasks({ api, logger }, { payload }) {
  const err = t('tasks-widget.saga.error1');

  try {
    const { document, stateId } = payload;
    const res = yield call(api.tasks.getTasksForUser, { document });

    if (res && Object.keys(res)) {
      yield put(setTaskList({ stateId, list: TasksConverter.getTaskListForWeb(res.records) }));
    } else {
      yield put(setNotificationMessage(err));
    }
  } catch (e) {
    yield put(setNotificationMessage(err));
    logger.error('[tasks/sagaGetTasks saga] error', e.message);
  }
}

function* sagaChangeTaskAssignee({ api, logger }, { payload }) {
  const err = t('tasks-widget.saga.error2');
  const suc = id => t('tasks-widget.saga.change-assignee-success');

  try {
    const { taskId, stateId, ownerUserName, actionOfAssignment } = payload;
    const res = yield call(api.tasks.changeAssigneeTask, { taskId, action: actionOfAssignment, owner: ownerUserName });

    if (res && Object.keys(res).length) {
      const updatedFields = yield call(api.tasks.getTaskStateAssign, { taskId });
      const list = yield TasksService.updateList({ stateId, taskId, updatedFields, ownerUserName });

      yield put(setTaskAssignee({ stateId, list }));
      yield put(setNotificationMessage(suc(res.id)));
    } else {
      yield put(setNotificationMessage(err));
    }
  } catch (e) {
    yield put(setNotificationMessage(err));
    logger.error('[tasks/sagaChangeAssigneeTask saga] error', e.message);
  }
}

function* tasksSaga(ea) {
  yield takeEvery(getTaskList().type, sagaGetTasks, ea);
  yield takeEvery(changeTaskAssignee().type, sagaChangeTaskAssignee, ea);
}

export default tasksSaga;
