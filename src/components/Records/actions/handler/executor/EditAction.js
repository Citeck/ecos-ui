import React from 'react';

import { SourcesId } from '../../../../../constants';
import { URL_PAGECONTEXT } from '../../../../../constants/alfresco';
import { goToNodeEditPage } from '../../../../../helpers/urls';
import TaskAssignmentPanel from '../../../../TaskAssignmentPanel';
import EcosFormUtils from '../../../../EcosForm/EcosFormUtils';
import { notifyFailure } from '../../util/actionUtils';
import ActionsExecutor from '../ActionsExecutor';
import DashboardService from '../../../../../services/dashboard';

export default class EditAction extends ActionsExecutor {
  static ACTION_ID = 'edit';

  async execForRecord(record, action, context) {
    const { config = {} } = action;

    switch (true) {
      case config.mode === 'task':
        return runEditTask(record, config);
      case DashboardService.isDashboardRecord(record.id):
        DashboardService.openEditModal({
          dashboardId: DashboardService.formShortId(record.id)
        });
        return;
      default:
        return new Promise(resolve => {
          let submitted = false;
          let wasClosed = false;
          EcosFormUtils.editRecord({
            recordRef: record.id,
            attributes: config.attributes || {},
            fallback: () => goToNodeEditPage(record.id),
            onSubmit: () => {
              // temp solution
              submitted = true;
              if (!wasClosed) {
                wasClosed = true;
                setTimeout(() => resolve(submitted), 500);
              }
            },
            onCancel: () => {
              // temp solution
              if (!wasClosed) {
                wasClosed = true;
                setTimeout(() => resolve(submitted), 500);
              }
            }
          });
        });
    }
  }

  getDefaultActionModel() {
    return {
      name: 'record-action.name.edit',
      icon: 'icon-edit'
    };
  }
}

function runEditTask(record, config) {
  return record.load('cm:name?str').then(taskId => {
    if (!taskId) {
      // console.error('Task ID is not found for record', record);
      notifyFailure();
      return false;
    }

    const taskRecordId = `${SourcesId.TASK}@${taskId}`;
    const contentBefore = () => <TaskAssignmentPanel narrow executeRequest taskId={taskRecordId} />;

    return new Promise(resolve => {
      EcosFormUtils.editRecord({
        recordRef: taskRecordId,
        attributes: config.attributes || {},
        fallback: () => {
          window.open(`${URL_PAGECONTEXT}task-edit?taskId=${taskId}&formMode=edit`, '_blank');
          resolve(false);
        },
        contentBefore: contentBefore(),
        onSubmit: () => resolve(true),
        onFormCancel: () => resolve(false)
      });
    });
  });
}
