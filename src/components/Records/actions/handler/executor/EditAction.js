import React from 'react';

import { SourcesId } from '../../../../../constants';
import DashboardService from '../../../../../services/dashboard';
import EcosFormUtils from '../../../../EcosForm/EcosFormUtils';
import TaskAssignmentPanel from '../../../../TaskAssignmentPanel';
import Records from '../../../Records';
import { notifyFailure } from '../../util/actionUtils';
import ActionsExecutor from '../ActionsExecutor';

export default class EditAction extends ActionsExecutor {
  static ACTION_ID = 'edit';

  async execForRecord(record, action, context) {
    const { config = {} } = action;
    const recordId = config.recordId || record.id;

    const actionResult = new Promise((resolve, reject) => {
      switch (true) {
        case config.mode === 'task':
          runEditTask(record, config).then(resolve).catch(reject);
          break;
        case DashboardService.isDashboardRecord(recordId):
          DashboardService.openEditModal({
            dashboardId: DashboardService.formShortId(recordId),
            onSave: () => resolve(true),
            onClose: () => resolve(false)
          });
          break;
        default: {
          let submitted = false;
          let wasClosed = false;

          EcosFormUtils.editRecord({
            recordRef: recordId,
            options: { actionRecord: recordId },
            saveOnSubmit: config.saveOnSubmit !== false,
            attributes: config.attributes || {},
            formContainer: true,
            onFormCancel: config.onFormCancel,
            onAfterHideModal: config.onAfterHideModal,
            onPreSettingSubmit: config.onPreSettingSubmit,
            handlers: config.handlers,
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
        }
      }
    });

    return actionResult.then(somethingWasChanged => {
      if (somethingWasChanged) {
        const recordsToReset = config.recordsToReset || [];
        for (let recId of recordsToReset) {
          Records.get(recId).reset();
        }
      }
      return somethingWasChanged;
    });
  }

  getDefaultActionModel() {
    return {
      name: 'record-action.name.edit',
      icon: 'icon-edit'
    };
  }
}

async function runEditTask(record, config) {
  const taskId = await record.load('cm:name?str');
  if (!taskId) {
    notifyFailure();
    return false;
  }

  const taskRecordId = `${SourcesId.TASK}@${taskId}`;
  const contentBefore = () => <TaskAssignmentPanel narrow taskId={taskRecordId} />;

  return new Promise(resolve => {
    EcosFormUtils.editRecord({
      recordRef: taskRecordId,
      attributes: config.attributes || {},
      formContainer: true,
      fallback: () => resolve(false),
      contentBefore: contentBefore(),
      onSubmit: () => resolve(true),
      onFormCancel: () => resolve(false)
    });
  });
}
