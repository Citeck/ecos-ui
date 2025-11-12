import React, { Suspense } from 'react';
import { Provider } from 'react-redux';

import { getStore } from '../../../../../../store';
import DialogManager from '../../../../../common/dialogs/Manager';
import { Loader } from '../../../../../common/index';
import Tasks from '../../../../../widgets/Tasks/Tasks';
import ActionsExecutor from '../../ActionsExecutor';

export default class OpenTaskActions extends ActionsExecutor {
  static ACTION_ID = 'open-task-actions';

  async execForRecord(record, action, context) {
    const { id, dashboardStateId } = action;
    const taskId = id && id.includes('@') ? id.split('@')[1] : id;

    if (!taskId || !dashboardStateId) {
      console.error('Incorrect action', action);

      DialogManager.showInfoDialog({
        title: 'record-action.task-outcome.incorrect-action.header',
        text: 'record-action.task-outcome.incorrect-action.message'
      });

      return false;
    }

    const store = getStore();

    const dialog = DialogManager.showCustomDialog({
      title: action.name,
      isVisible: true,
      onHide: () => dialog.setVisible(false),
      body: (
        <Provider store={store}>
          <Suspense fallback={<Loader type="points" />}>
            <Tasks
              onSubmit={() => dialog.setVisible(false)}
              stateId={dashboardStateId}
              instanceRecord={record}
              record={record.id}
              taskId={taskId}
              isMobile
            />
          </Suspense>
        </Provider>
      )
    });

    return true;
  }

  getDefaultActionModel() {
    return {
      name: 'module.copy'
    };
  }
}
