import { call, put, takeEvery } from 'redux-saga/effects';
import { changeTaskAssignee, getTaskList, setSaveTaskResult, setTaskList } from '../actions/tasks';
import { setNotificationMessage } from '../actions/notification';
import { t } from '../helpers/util';
import { AssignOptions } from '../constants/tasks';
import TasksConverter from '../dto/tasks';
import TasksService from '../services/tasks';

function* sagaGetTasks({ api, logger }, { payload }) {
  const err = t('Ошибка получения данные');

  try {
    const { sourceId, document } = payload;
    const res = yield call(api.tasks.getTasks, { sourceId, document });

    if (res && Object.keys(res)) {
      yield put(setTaskList({ stateId: sourceId, list: TasksConverter.getTaskListForWeb(res.records) }));
    } else {
      yield put(setNotificationMessage(err));
    }
  } catch (e) {
    yield put(setNotificationMessage(err));
    logger.error('[tasks/sagaGetTasks saga] error', e.message);
  }
}

function* sagaChangeTaskAssignee({ api, logger }, { payload }) {
  const err = t('Ошибка изменении задачи');

  try {
    const { taskId, sourceId, document, userUid, selectionAssign } = payload;
    const userAssignId = yield TasksService.defineUserByStateAssign({ selectionAssign, userUid });
    const res = yield call(api.tasks.changeAssigneeTask, { taskId, sourceId, document, userUid: userAssignId });

    //todo temp
    var stateAssign = {
      claimable: AssignOptions.UNASSIGN === selectionAssign,
      releasable: AssignOptions.ASSIGN_ME === selectionAssign,
      reassignable: false
    };

    if (res && Object.keys(res)) {
      const result = {
        status: res ? 'SUCCESS' : 'FAILURE',
        taskId: res.id,
        assignee: '', //todo temp?
        stateAssign //todo temp?
      };

      const list = yield TasksService.updateList({ sourceId, selectionAssign, result });
      yield put(setSaveTaskResult({ stateId: sourceId, result, list }));
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
