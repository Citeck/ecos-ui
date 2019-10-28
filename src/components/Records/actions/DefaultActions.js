import Records from '../Records';
import { getDownloadContentUrl, goToCardDetailsPage, goToJournalsPage, goToNodeEditPage } from '../../../helpers/urls';
import EcosFormUtils from '../../EcosForm/EcosFormUtils';
import dialogManager from '../../common/dialogs/Manager';
import { URL_PAGECONTEXT } from '../../../constants/alfresco';

const globalTasks = ['active-tasks', 'completed-tasks', 'controlled', 'subordinate-tasks', 'task-statistic', 'initiator-tasks'];

const globalTaskPatterns = [/active-tasks/, /completed-tasks/, /controlled/, /subordinate-tasks/, /task-statistic/, /initiator-tasks/];

export const EditAction = {
  disabledFor: [/task-statistic/, /completed-tasks/],

  execute: ({ record, context }) => {
    if (globalTasks.indexOf(context.scope) > -1) {
      const name = record.att('cm:name?disp') || '';
      window.open(`${URL_PAGECONTEXT}task-edit?taskId=${name}&formMode=edit`, '_blank');
      return false;
    }

    return new Promise(resolve => {
      EcosFormUtils.editRecord({
        recordRef: record.id,
        fallback: () => goToNodeEditPage(record.id),
        onSubmit: () => resolve(true),
        onCancel: () => resolve(false)
      });
    });
  },

  canBeExecuted: ({ context }) => {
    const { scope = '' } = context;
    for (let pattern of EditAction.disabledFor) {
      if (pattern.test(scope)) {
        return false;
      }
    }
    return true;
  }
};

export const ViewAction = {
  disabledFor: [/^event-lines.*/, /task-statistic/],

  execute: ({ record, context }) => {
    if (globalTasks.indexOf(context.scope) > -1) {
      const name = record.att('cm:name?disp') || '';
      window.open(`${URL_PAGECONTEXT}task-details?taskId=${name}&formMode=view`, '_blank');
      return false;
    }

    goToCardDetailsPage(record.id);
    return false;
  },

  canBeExecuted: ({ context }) => {
    const { scope = '' } = context;
    for (let pattern of ViewAction.disabledFor) {
      if (pattern.test(scope)) {
        return false;
      }
    }
    return true;
  }
};

export const DownloadAction = {
  execute: ({ record }) => {
    const url = getDownloadContentUrl(record.id);
    const a = document.createElement('A', { target: '_blank' });

    a.href = url;
    a.download = url;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    return false;
  },

  canBeExecuted: ({ record }) => {
    return !!record.att('.has(n:"cm:content")');
  }
};

export const RemoveAction = {
  disabledFor: [/^event-lines.*/, ...globalTaskPatterns],

  groupExec: ({ records }) => {
    return new Promise(resolve => {
      dialogManager.showRemoveDialog({
        onDelete: () => {
          Records.remove(records)
            .then(() => {
              resolve(true);
            })
            .catch(e => {
              console.error(e);
              resolve(false);
            });
        },
        onCancel: () => {
          resolve(false);
        }
      });
    });
  },

  canBeExecuted: ({ context }) => {
    const { scope = '' } = context;
    for (let pattern of RemoveAction.disabledFor) {
      if (pattern.test(scope)) {
        return false;
      }
    }
    return true;
  }
};

//this action will be removed
export const MoveToLinesJournal = {
  enabledFor: ['incidents'],

  execute: ({ record }) => {
    let recordId = record.id;

    record.load('skifem:eventTypeAssoc.skifdm:eventTypeId?str').then(eventType => {
      goToJournalsPage({
        journalsListId: 'site-ssg-skif-main',
        journalId: 'event-lines-' + eventType,
        filter: JSON.stringify({
          t: 'eq',
          att: 'skifem:eventRef',
          val: recordId
        })
      });
    });

    return false;
  },

  canBeExecuted: ({ context }) => {
    const { scope = '' } = context;
    return MoveToLinesJournal.enabledFor.indexOf(scope) > -1;
  }
};
