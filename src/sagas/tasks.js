import { call, put, select, takeEvery } from 'redux-saga/effects';
import { changeTaskAssignee, getTaskList, setSaveTaskResult, setTaskList } from '../actions/tasks';
import { setNotificationMessage } from '../actions/notification';
import { t } from '../helpers/util';
import TasksDto from '../dto/tasks';
import TasksService from '../services/tasks';
import { selectUserFullName } from '../selectors/user';

function* sagaGetTasks({ api, logger }, { payload }) {
  const err = t('Ошибка получения данные');
  //console.log("sagaGetTasks input", payload);
  try {
    const { sourceId, document } = payload;
    const res = yield call(api.tasks.getTasks, { sourceId, document });

    if (res && Object.keys(res)) {
      yield put(setTaskList({ stateId: sourceId, list: TasksDto.getTaskListForWeb(res.records) }));
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
  //console.log('sagaChangeTaskAssignee payload', payload);
  try {
    const { taskId, sourceId, document, userUid, stateAssign } = payload;
    const userAssignId = yield TasksService.defineUserByStateAssign({ stateAssign, userUid });
    const res = yield call(api.tasks.changeAssigneeTask, { taskId, sourceId, document, userUid: userAssignId });

    if (res && Object.keys(res)) {
      const result = {
        status: res ? 'SUCCESS' : 'FAILURE',
        taskId: res.id,
        assignee: '', //todo temp?
        stateAssign: stateAssign //todo temp?
      };

      const list = yield TasksService.updateList({ sourceId, result });
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
