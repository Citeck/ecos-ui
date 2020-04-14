import { call, put, takeEvery } from 'redux-saga/effects';
import isEmpty from 'lodash/isEmpty';
import { NotificationManager } from 'react-notifications';

import { changeTaskAssignee, getTaskList, setTaskAssignee, setTaskList } from '../actions/tasks';
import { setNotificationMessage } from '../actions/notification';
import { t } from '../helpers/util';
import TasksConverter from '../dto/tasks';
import TasksService from '../services/tasks';

function* sagaGetTasks({ api, logger }, { payload }) {
  try {
    const { record: document, stateId } = payload;
    const res = yield call(api.tasks.getTasksForUser, { document });

    if (isEmpty(res)) {
      NotificationManager.warning(t('tasks-widget.saga.error1'));
      setTaskList({ stateId, list: [], totalCount: 0 });
    } else {
      yield put(
        setTaskList({
          stateId,
          list: TasksConverter.getTaskListForWeb(res.records),
          totalCount: res.totalCount || 0
        })
      );
    }
  } catch (e) {
    yield put(setNotificationMessage(t('tasks-widget.saga.error1')));
    logger.error('[tasks/sagaGetTasks saga] error', e.message);
  }
}

function* sagaChangeTaskAssignee({ api, logger }, { payload }) {
  try {
    const { taskId, stateId, ownerUserName, actionOfAssignment } = payload;

    const save = yield call(api.tasks.changeAssigneeTask, { taskId, action: actionOfAssignment, owner: ownerUserName });

    if (!save) {
      NotificationManager.warning(t('tasks-widget.saga.error3'));
    }

    const updatedFields = yield call(api.tasks.getTaskStateAssign, { taskId });
    const data = yield TasksService.updateList({ stateId, taskId, updatedFields, ownerUserName });

    yield put(setTaskAssignee({ stateId, ...data }));
  } catch (e) {
    yield put(setNotificationMessage(t('tasks-widget.saga.error2')));
    logger.error('[tasks/sagaChangeAssigneeTask saga] error', e.message);
  }
}

function* tasksSaga(ea) {
  yield takeEvery(getTaskList().type, sagaGetTasks, ea);
  yield takeEvery(changeTaskAssignee().type, sagaChangeTaskAssignee, ea);
}

export default tasksSaga;
