import { call, put, takeEvery } from 'redux-saga/effects';
import { changeTaskDetails, getTaskList, setSaveTaskResult, setTaskList } from '../actions/tasks';
import { setNotificationMessage } from '../actions/notification';
import { t } from '../helpers/util';
import TasksDto from '../dto/tasks';

function* sagaGetTasks({ api, logger }, { payload }) {
  const err = t('Ошибка получения данные');

  try {
    const { sourceId, recordRef } = payload;
    const res = yield call(api.tasks.getTasks, { sourceId, recordRef });

    if (res && Object.keys(res)) {
      yield put(setTaskList({ sourceId, list: TasksDto.getTaskListForWeb(res.records) }));
    } else {
      yield put(setNotificationMessage(err));
    }
  } catch (e) {
    yield put(setNotificationMessage(err));
    logger.error('[tasks/sagaGetTasks saga] error', e.message);
  }
}

function* sagaSetTaskDetails({ api, logger }, { payload }) {
  const err = t('Ошибка изменении задачи');
  //todo todo todo
  console.log('sagaSetTaskDetails payload', payload);

  try {
    const { taskId, sourceId, recordRef } = payload;
    const res = yield call(api.tasks.changeAssigneeTask, { taskId, sourceId, recordRef });

    if (res && Object.keys(res)) {
      const result = {
        status: res ? 'SUCCESS' : 'FAILURE',
        taskId: res.id,
        taskData: res
          ? {
              stateAssign: payload.stateAssign,
              assignee: payload.userUid
            }
          : {}
      };

      yield put(setSaveTaskResult({ sourceId, result }));
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
  yield takeEvery(changeTaskDetails().type, sagaSetTaskDetails, ea);
}

export default tasksSaga;
