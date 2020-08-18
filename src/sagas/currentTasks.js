import { call, put, select, takeEvery } from 'redux-saga/effects';
import isEmpty from 'lodash/isEmpty';
import { NotificationManager } from 'react-notifications';

import recordActions from '../components/Records/actions/recordActions';
import Records from '../components/Records/Records';
import { executeAction, getActions, getCurrentTaskList, initCurrentTasks, setActions, setCurrentTaskList } from '../actions/currentTasks';
import { t } from '../helpers/util';
import { AssignActions, TaskActions } from '../constants/tasks';
import TasksConverter from '../dto/tasks';

function* runInit({ api, logger }, { payload }) {
  try {
    yield* sagaGetCurrentTasks({ api, logger }, { payload });
    yield* sagaGetActions({ api, logger }, { payload });
  } catch (e) {
    logger.error('[current-tasks/runInit saga] error', e.message);
  }
}

function* sagaGetCurrentTasks({ api, logger }, { payload }) {
  try {
    const { record: document, stateId } = payload;
    const res = yield call(api.tasks.getCurrentTasksForUser, { document });

    if (isEmpty(res)) {
      NotificationManager.error(t('current-tasks-widget.error.get-tasks'), t('error'));
    } else {
      yield put(
        setCurrentTaskList({
          stateId,
          list: TasksConverter.getCurrentTaskListForWeb(res.records),
          totalCount: res.totalCount || 0
        })
      );
    }
  } catch (e) {
    NotificationManager.error(t('current-tasks-widget.error.get-tasks'), t('error'));
    logger.error('[current-tasks/sagaGetCurrentTasks saga] error', e.message);
  }
}

function* sagaGetActions({ api, logger }, { payload }) {
  try {
    const { record, stateId } = payload;
    const isAdmin = yield select(state => state.user.isAdmin);

    if (isAdmin) {
      const actions = yield recordActions.getActionsForRecord(record, TaskActions, {});

      yield put(setActions({ stateId, actions }));
    }
  } catch (e) {
    NotificationManager.error(t('current-tasks-widget.error.get-actions'), t('error'));
    logger.error('[current-tasks/sagaGetActions saga] error', e.message);
  }
}

function* sagaExecuteAction({ api, logger }, { payload }) {
  try {
    const { taskId: records, action, record } = payload;

    yield call(api.recordActions.executeAction, {
      records,
      action: { ...action, actionOfAssignment: AssignActions.ASSIGN_SMB, workflowFromRecord: true }
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
  yield takeEvery(getActions().type, sagaGetActions, ea);
  yield takeEvery(executeAction().type, sagaExecuteAction, ea);
}

export default tasksSaga;
