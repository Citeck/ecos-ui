import { call, put, select, takeEvery } from 'redux-saga/effects';
import isEmpty from 'lodash/isEmpty';
import { NotificationManager } from 'react-notifications';

import Records from '../components/Records/Records';
import { executeAction, getCurrentTaskList, initCurrentTasks, setCurrentTaskList } from '../actions/currentTasks';
import { t } from '../helpers/util';
import { AssignActions } from '../constants/tasks';
import TasksConverter from '../dto/tasks';

function* runInit({ api, logger }, { payload }) {
  try {
    yield* sagaGetCurrentTasks({ api, logger }, { payload });
  } catch (e) {
    logger.error('[current-tasks/runInit saga] error', e.message);
  }
}

function* sagaGetCurrentTasks({ api, logger }, { payload }) {
  try {
    const { record: document, stateId } = payload;
    const isAdmin = yield select(state => state.user.isAdmin);
    const result = yield call(api.tasks.getCurrentTasksForUser, { document });

    if (isEmpty(result)) {
      NotificationManager.error(t('current-tasks-widget.error.get-tasks'), t('error'));
    } else {
      const currentTasksList = TasksConverter.getCurrentTaskListForWeb(result.records);
      for (let currentTask of currentTasksList) {
        currentTask.actions = yield call(api.tasks.getCurrentTaskActionsForUser, {
          taskId: currentTask.id,
          reassignAvailable: currentTask.hasPermissionReassign,
          isAdmin
        });
      }
      yield put(
        setCurrentTaskList({
          stateId,
          list: currentTasksList,
          totalCount: result.totalCount || 0
        })
      );
    }
  } catch (e) {
    NotificationManager.error(t('current-tasks-widget.error.get-tasks'), t('error'));
    logger.error('[current-tasks/sagaGetCurrentTasks saga] error', e.message);
  }
}

function* sagaExecuteAction({ api, logger }, { payload }) {
  try {
    const { taskId: records, action, record } = payload;

    yield call(api.recordActions.executeAction, {
      records,
      action: { ...action, actionOfAssignment: AssignActions.CLAIM, workflowFromRecord: true }
    });

    Records.get(record).update();
  } catch (e) {
    NotificationManager.error(t('current-tasks-widget.error.execute-action'), t('error'));
    logger.error('[current-tasks/sagaExecuteAction saga] error', e.message);
  }
}

function* tasksSaga(ea) {
  yield takeEvery(initCurrentTasks().type, runInit, ea);
  yield takeEvery(getCurrentTaskList().type, sagaGetCurrentTasks, ea);
  yield takeEvery(executeAction().type, sagaExecuteAction, ea);
}

export default tasksSaga;
