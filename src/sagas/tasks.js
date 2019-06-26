import { call, put, takeLatest } from 'redux-saga/effects';
import { changeTaskDetails, getDashletTasks, setDashletTasks, setSaveTaskResult } from '../actions/tasks';
import { setNotificationMessage } from '../actions/notification';
import { t } from '../helpers/util';
import TasksDto from '../dto/tasks';

function* sagaGetTasks({ api, logger }, { payload }) {
  const err = t('Ошибка получения данные');

  try {
    const { sourceId, recordRef } = payload;
    const res = yield call(api.tasks.getTasks, { sourceId, recordRef });
    console.log(res);
    if (res && Object.keys(res)) {
      yield put(setDashletTasks(TasksDto.getTaskListForWeb(res.records)));
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
      yield put(
        setSaveTaskResult({
          status: res ? 'SUCCESS' : 'FAILURE',
          taskId: res.id,
          taskData: res
            ? {
                stateAssign: payload.stateAssign,
                assignee: payload.userUid
              }
            : {}
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
  yield takeLatest(getDashletTasks().type, sagaGetTasks, ea);
  yield takeLatest(changeTaskDetails().type, sagaSetTaskDetails, ea);
}

export default tasksSaga;
