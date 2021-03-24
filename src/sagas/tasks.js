import { call, put, takeEvery } from 'redux-saga/effects';
import isEmpty from 'lodash/isEmpty';
import { NotificationManager } from 'react-notifications';

import { changeTaskAssignee, getTaskList, setTaskAssignee, setTaskList } from '../actions/tasks';
import { setNotificationMessage } from '../actions/notification';
import { t } from '../helpers/util';
import TasksConverter from '../dto/tasks';
import SidebarService from '../services/sidebar';
import Records from '../components/Records';

function* sagaGetTasks({ api, logger }, { payload }) {
  try {
    const { record: document, stateId } = payload;
    const res = yield call(api.tasks.getTasksForUser, { document });

    if (isEmpty(res)) {
      NotificationManager.warning(t('tasks-widget.error.get-tasks'));
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

    SidebarService.emitter.emit(SidebarService.UPDATE_EVENT);
  } catch (e) {
    yield put(setNotificationMessage(t('tasks-widget.error.get-tasks')));
    logger.error('[tasks/sagaGetTasks saga] error', e.message);
  }
}

function* sagaChangeTaskAssignee({ api, logger }, { payload }) {
  try {
    const { record, stateId } = payload;

    yield put(setTaskAssignee({ stateId }));
    yield Records.get(record).update();
  } catch (e) {
    yield put(setNotificationMessage(t('tasks-widget.error.assign-task')));
    logger.error('[tasks/sagaChangeAssigneeTask saga] error', e.message);
  }
}

function* tasksSaga(ea) {
  yield takeEvery(getTaskList().type, sagaGetTasks, ea);
  yield takeEvery(changeTaskAssignee().type, sagaChangeTaskAssignee, ea);
}

export default tasksSaga;
