import Records from '../Records';
import { getDownloadContentUrl, goToCardDetailsPage, goToJournalsPage, goToNodeEditPage } from '../../../helpers/urls';
import EcosFormUtils from '../../EcosForm/EcosFormUtils';
import dialogManager from '../../common/dialogs/Manager';
import { URL_PAGECONTEXT } from '../../../constants/alfresco';
import { FORM_MODE_CREATE } from '../../EcosForm';

const globalTasks = ['active-tasks', 'completed-tasks', 'controlled', 'subordinate-tasks', 'task-statistic', 'initiator-tasks'];

const globalTaskPatterns = [/active-tasks/, /completed-tasks/, /controlled/, /subordinate-tasks/, /task-statistic/, /initiator-tasks/];

export const EditAction = {
  disabledFor: [/task-statistic/, /completed-tasks/],

  execute: ({ record, action: { context } }) => {
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

  getDefaultModel: () => {
    return {
      name: 'grid.inline-tools.edit',
      type: 'edit',
      icon: 'icon-edit'
    };
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

  execute: ({ record, action: { context } }) => {
    if (globalTasks.indexOf(context.scope) > -1) {
      const name = record.att('cm:name?disp') || '';
      window.open(`${URL_PAGECONTEXT}task-details?taskId=${name}&formMode=view`, '_blank');
      return false;
    }

    goToCardDetailsPage(record.id);
    return false;
  },

  getDefaultModel: () => {
    return {
      name: 'grid.inline-tools.show',
      type: 'view',
      icon: 'icon-on'
    };
  },

  canBeExecuted: ({ context }) => {
    const { scope = '', mode = '' } = context;
    if (mode === 'dashboard') {
      return false;
    }
    for (let pattern of ViewAction.disabledFor) {
      if (pattern.test(scope)) {
        return false;
      }
    }
    return true;
  }
};

export const BackgroundOpenAction = {
  type: 'open-in-background',

  disabledFor: [/^event-lines.*/, /task-statistic/],

  execute: ({ record, action: { context } }) => {
    if (globalTasks.indexOf(context.scope) > -1) {
      const name = record.att('cm:name?disp') || '';

      window.open(`${URL_PAGECONTEXT}task-details?taskId=${name}&formMode=view`, '_blank');
      return false;
    }

    goToCardDetailsPage(record.id, { openInBackground: true });
    return false;
  },

  getDefaultModel: () => {
    return {
      name: 'grid.inline-tools.open-in-background',
      type: BackgroundOpenAction.type,
      icon: 'icon-on'
    };
  },

  canBeExecuted: ({ context }) => {
    const { scope = '', mode = '' } = context;
    if (mode === 'dashboard') {
      return false;
    }
    for (let pattern of ViewAction.disabledFor) {
      if (pattern.test(scope)) {
        return false;
      }
    }
    return true;
  }
};

export const DownloadAction = {
  execute: ({ record, action }) => {
    const config = action.config || {};

    let url = config.url || getDownloadContentUrl(record.id);
    url = url.replace('${recordRef}', record.id); // eslint-disable-line no-template-curly-in-string

    const name = config.filename || 'file';

    const a = document.createElement('A', { target: '_blank' });

    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    return false;
  },

  getDefaultModel: () => {
    return {
      name: 'grid.inline-tools.download',
      type: 'download',
      icon: 'icon-download'
    };
  },

  canBeExecuted: ({ record }) => {
    return record.att('.has(n:"cm:content")') !== false;
  }
};

export const DeleteAction = {
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

  getDefaultModel: () => {
    return {
      name: 'grid.inline-tools.delete',
      type: 'delete',
      icon: 'icon-delete',
      theme: 'danger'
    };
  },

  canBeExecuted: ({ context }) => {
    const { scope = '' } = context;
    for (let pattern of DeleteAction.disabledFor) {
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

  getDefaultModel: () => {
    return {
      name: 'grid.inline-tools.details',
      type: 'move-to-lines',
      icon: 'icon-big-arrow'
    };
  },

  canBeExecuted: ({ context }) => {
    const { scope = '' } = context;
    return MoveToLinesJournal.enabledFor.indexOf(scope) > -1;
  }
};

export const DownloadCardTemplate = {
  execute: ({ record, action = {}, action: { config = {} } }) => {
    let url =
      '/share/proxy/alfresco/citeck/print/metadata-printpdf' +
      '?nodeRef=' +
      record.id +
      '&templateType=' +
      config.templateType +
      '&print=true&format=' +
      config.format;

    return DownloadAction.execute({
      record: record,
      action: {
        ...action,
        config: {
          url,
          filename: 'template.' + config.format
        }
      }
    });
  },

  getDefaultModel: () => DownloadAction.getDefaultModel()
};

export const CreateNodeAction = {
  execute: ({ record, action }) => {
    const fromRecordRegexp = /^\$\$/;
    let { config = {} } = action,
      attributesFromRecord = {};

    Object.entries(config.attributes || {})
      .filter(entry => fromRecordRegexp.test(entry[1]))
      .forEach(entry => {
        attributesFromRecord[entry[0]] = entry[1].replace(fromRecordRegexp, '');
      });

    return new Promise(resolve => {
      let params = {
        formMode: FORM_MODE_CREATE,
        attributes: config.attributes || {},
        options: config.options || {},
        onSubmit: () => resolve(true),
        onFormCancel: () => resolve(false)
      };

      if (!!config.formId) {
        params.formId = config.formId;
      } else {
        params.formKey = config.formKey;
      }

      try {
        Records.get(record)
          .load(attributesFromRecord)
          .then(result => {
            params.attributes = Object.assign(params.attributes, result);
            EcosFormUtils.eform('dict@' + config.nodeType, {
              params: params,
              class: 'ecos-modal_width-lg',
              isBigHeader: true
            });
          });
      } catch (e) {
        console.error(e);
        resolve(false);
      }
    });
  },

  getDefaultModel: () => {
    return {
      name: 'grid.inline-tools.create',
      type: 'create',
      icon: 'icon-plus'
    };
  }
};
