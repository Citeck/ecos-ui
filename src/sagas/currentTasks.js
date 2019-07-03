import { call, put, takeEvery } from 'redux-saga/effects';
import { getCurrentTaskList, setCurrentTaskList, setTaskAssignee } from '../actions/tasks';
import { setNotificationMessage } from '../actions/notification';
import { t } from '../helpers/util';
import TasksConverter from '../dto/tasks';
import TasksService from '../services/tasks';

function* sagaGetCurrentTasks({ api, logger }, { payload }) {
  const err = t('Ошибка получения данные');

  try {
    const { document, stateId } = payload;
    const res = yield call(api.tasks.getCurrentTasksForUser, { document });

    if (res && Object.keys(res)) {
      yield put(setCurrentTaskList({ stateId, list: TasksConverter.getTaskListForWeb(res.records) }));
    } else {
      yield put(setNotificationMessage(err));
    }
  } catch (e) {
    yield put(setNotificationMessage(err));
    logger.error('[tasks/sagaGetCurrentTasks saga] error', e.message);
  }
}

function* sagaChangeTaskAssignee({ api, logger }, { payload }) {
  const err = t('Ошибка назначения');
  const suc = id => t('Успешное назначение задачи');

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
  yield takeEvery(getCurrentTaskList().type, sagaGetCurrentTasks, ea);
  // yield takeEvery(changeTaskAssignee().type, sagaChangeTaskAssignee, ea);
}

export default tasksSaga;
