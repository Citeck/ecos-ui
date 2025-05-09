import isEmpty from 'lodash/isEmpty';
import { call, put, takeEvery } from 'redux-saga/effects';

import { changeTaskAssignee, getTaskList, setTaskAssignee, setTaskList } from '../actions/tasks';
import Records from '../components/Records';
import TasksConverter from '../dto/tasks';
import { t } from '../helpers/util';
import SidebarService from '../services/sidebar';

import { NotificationManager } from '@/services/notifications';

function notify(type, keyMsg) {
  NotificationManager[type](t(keyMsg), t('current-tasks-widget.notify.title'));
}

function* sagaGetTasks({ api }, { payload }) {
  try {
    const { record: document, stateId } = payload;
    const res = yield call(api.tasks.getTasksForUser, { document });

    if (isEmpty(res)) {
      notify('warning', 'tasks-widget.error.get-tasks');
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
    notify('error', 'tasks-widget.error.get-tasks');
    console.error('[tasks/sagaGetTasks saga] error', e);
  }
}

function* sagaChangeTaskAssignee({ api }, { payload }) {
  try {
    const { record, stateId } = payload;

    yield put(setTaskAssignee({ stateId }));
    yield Records.get(record).update();
  } catch (e) {
    notify('error', 'tasks-widget.error.assign-task');
    console.error('[tasks/sagaChangeAssigneeTask saga] error', e);
  }
}

function* tasksSaga(ea) {
  yield takeEvery(getTaskList().type, sagaGetTasks, ea);
  yield takeEvery(changeTaskAssignee().type, sagaChangeTaskAssignee, ea);
}

export default tasksSaga;
