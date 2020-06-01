import { NotificationManager } from 'react-notifications';
import isEmpty from 'lodash/isEmpty';
import get from 'lodash/get';

import {
  createPrintUrl,
  getDownloadContentUrl,
  getTemplateUrl,
  goToCardDetailsPage,
  goToJournalsPage,
  goToNodeEditPage
} from '../../../helpers/urls';
import { getTimezoneValue, t } from '../../../helpers/util';
import { ActionModes } from '../../../constants';
import { URL_PAGECONTEXT } from '../../../constants/alfresco';
import WidgetService from '../../../services/WidgetService';
import EcosFormUtils from '../../EcosForm/EcosFormUtils';
import dialogManager from '../../common/dialogs/Manager';
import Records from '../Records';
import RecordActions from './RecordActions';
import ecosFetch from '../../../helpers/ecosFetch';

const globalTasks = ['active-tasks', 'completed-tasks', 'controlled', 'subordinate-tasks', 'task-statistic', 'initiator-tasks'];

const globalTaskPatterns = [/active-tasks/, /completed-tasks/, /controlled/, /subordinate-tasks/, /task-statistic/, /initiator-tasks/];

export const DefaultActionTypes = {
  CREATE: 'create',
  EDIT: 'edit',
  VIEW: 'view',
  DELETE: 'delete',
  DOWNLOAD: 'download',
  OPEN_IN_BACKGROUND: 'open-in-background',
  MOVE_TO_LINES: 'move-to-lines',
  DOWNLOAD_CARD_TEMPLATE: 'download-card-template',
  VIEW_CARD_TEMPLATE: 'view-card-template',
  OPEN_URL: 'open-url',
  UPLOAD_NEW_VERSION: 'upload-new-version',
  ASSOC_ACTION: 'assoc-action',
  MODAL_DOC_PREVIEW: 'modal-doc-preview',
  SAVE_AS_CASE_TEMPLATE: 'save-as-case-template'
};

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
      name: 'record-action.name.edit',
      type: DefaultActionTypes.EDIT,
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

  execute: ({ record, action: { config = {}, context = {} } }) => {
    //todo + close + config.preview
    WidgetService.openPreviewModal({ recordId: record.id });
    return false;
    if (config.viewType === 'task-document-dashboard') {
      Records.get(record.id)
        .load('wfm:document?id')
        .then(docId => (docId ? goToCardDetailsPage(docId) : ''));
      return false;
    }

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
      name: 'record-action.name.show',
      type: DefaultActionTypes.VIEW,
      icon: 'icon-on'
    };
  },

  canBeExecuted: ({ context }) => {
    const { scope = '', mode = '' } = context;
    if (mode === ActionModes.DASHBOARD) {
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

export const OpenURL = {
  type: DefaultActionTypes.OPEN_URL,

  execute: ({ record, action }) => {
    const config = action.config || {};
    const url = config.url.replace('${recordRef}', record.id); // eslint-disable-line no-template-curly-in-string

    if (!url) {
      console.error(action);
      throw new Error('URL is a mandatory parameter! Record: ' + record.id + ' Action: ' + action.id);
    }

    window.open(url, config.target || '_blank');
  },

  getDefaultModel: () => {
    return {
      type: OpenURL.type
    };
  }
};

export const BackgroundOpenAction = {
  type: DefaultActionTypes.OPEN_IN_BACKGROUND,

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
      name: 'record-action.name.open-in-background',
      type: BackgroundOpenAction.type,
      icon: 'icon-newtab'
    };
  },

  canBeExecuted: ({ context }) => {
    const { scope = '', mode = '' } = context;
    if (mode === ActionModes.DASHBOARD) {
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

    if (config.downloadType === 'ecos_module') {
      record
        .load(
          {
            title: 'title',
            name: 'name',
            module_id: 'module_id',
            moduleId: 'moduleId',
            json: '.json'
          },
          true
        )
        .then(data => {
          let filename = config.filename || data.moduleId || data.module_id || data.title || data.name;
          filename = filename.replace(/[^a-zA-Zа-яА-Я0-9.]+/g, '_');

          if (!filename.endsWith('.json')) {
            filename += '.json';
          }
          DownloadAction._downloadText(JSON.stringify(data.json), filename, 'text/json');
        });
    } else {
      const name = config.filename || 'file';
      DownloadAction._downloadByUrl(config.url, name, record);
    }

    return false;
  },

  getDefaultModel: () => {
    return {
      name: 'record-action.name.download',
      type: DefaultActionTypes.DOWNLOAD,
      icon: 'icon-download'
    };
  },

  _downloadByUrl: (url, filename, record) => {
    url = url || getDownloadContentUrl(record.id);
    url = url.replace('${recordRef}', record.id); // eslint-disable-line no-template-curly-in-string

    const a = document.createElement('A', { target: '_blank' });

    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  },

  _downloadText: (text, filename, mimetype) => {
    const dataStr = 'data:' + mimetype + ';charset=utf-8,' + encodeURIComponent(text);
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute('href', dataStr);
    downloadAnchorNode.setAttribute('download', filename);
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }
};

export const DeleteAction = {
  disabledFor: [/^event-lines.*/, ...globalTaskPatterns],

  groupExec: ({ records }) => {
    return new Promise(resolve => {
      dialogManager.showRemoveDialog({
        title: records.length === 1 && 'record-action.delete.dialog.title.remove-one',
        text: records.length === 1 && 'record-action.delete.dialog.msg.remove-one',
        onDelete: () => {
          Records.remove(records)
            .then(() => {
              resolve(true);
            })
            .catch(e => {
              dialogManager.showInfoDialog({
                title: 'record-action.delete.dialog.title.error',
                text: e.message || 'record-action.delete.dialog.msg.error',
                onClose: () => {
                  resolve(false);
                }
              });
              console.error(e);
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
      name: 'record-action.name.delete',
      type: DefaultActionTypes.DELETE,
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
      name: 'record-action.name.details',
      type: DefaultActionTypes.MOVE_TO_LINES,
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
    const url = createPrintUrl({ record, config });

    return DownloadAction.execute({
      record,
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
    const fromRecordRegexp = /^\$/;
    const { config = {} } = action;
    const attributesFromRecord = {};
    const showForm = (recordRef, params) => {
      EcosFormUtils.eform(recordRef, {
        params: params,
        class: 'ecos-modal_width-lg',
        isBigHeader: true
      });
    };

    Object.entries(config.attributes || {})
      .filter(entry => fromRecordRegexp.test(entry[1]))
      .forEach(entry => {
        attributesFromRecord[entry[0]] = entry[1].replace(fromRecordRegexp, '');
      });

    return new Promise(resolve => {
      const params = {
        attributes: config.attributes || {},
        options: config.options || {},
        onSubmit: record => {
          record.update();
          resolve(true);
          record.id && goToCardDetailsPage(record.id);
        },
        onFormCancel: () => resolve(false)
      };

      if (!!config.formId) {
        params.formId = config.formId;
      } else {
        params.formKey = config.formKey;
      }

      try {
        if (!isEmpty(attributesFromRecord)) {
          Records.get(record)
            .load(attributesFromRecord)
            .then(result => {
              params.attributes = Object.assign({}, params.attributes, result);
              showForm(config.recordRef, params);
            });
        } else {
          showForm(config.recordRef, params);
        }
      } catch (e) {
        console.error(e);
        resolve(false);
      }
    });
  },

  getDefaultModel: () => {
    return {
      name: 'record-action.name.create',
      type: DefaultActionTypes.CREATE,
      icon: 'icon-plus'
    };
  }
};

export const UploadNewVersion = {
  execute: ({ record, action }) => {
    WidgetService.uploadNewVersion({ record });
  },

  getDefaultModel: () => {
    return {
      name: 'record-action.name.upload-new-version',
      type: DefaultActionTypes.UPLOAD_NEW_VERSION,
      icon: 'icon-load'
    };
  }
};

export const AssocAction = {
  execute: ({ record, action }) => {
    const actionType = get(action, 'config.action', null);
    let assoc = get(action, 'config.assoc', '');

    if (!assoc.includes('?')) {
      assoc += '?id';
    }

    Records.get(record)
      .load(assoc, true)
      .then(result => {
        if (!result) {
          NotificationManager.error('', t('record-action.assoc-action.not-found'));
          return;
        }

        if (actionType) {
          RecordActions.execAction(result, actionType);
        }
      });
  },

  getDefaultModel: () => {
    return {
      name: 'record-action.name.assoc-action',
      type: DefaultActionTypes.ASSOC_ACTION
    };
  }
};

export const ViewCardTemplate = {
  type: DefaultActionTypes.VIEW_CARD_TEMPLATE,
  execute: ({ record, action: { config = {} } }) => {
    const timezoneConfig = config.includeTimezone || config.includeTimezone == null ? getTimezoneValue() : {};
    const url = createPrintUrl({ record, config: { ...config, ...timezoneConfig } });

    window.open(url, '_blank');
  },
  getDefaultModel: () => ({
    name: 'record-action.name.view-card-template-in-background',
    type: DefaultActionTypes.VIEW_CARD_TEMPLATE,
    icon: 'icon-newtab'
  })
};

export const SaveAsCaseTemplate = {
  execute: ({ record, action = {} }) => {
    return ecosFetch(getTemplateUrl(record.id), { method: 'POST' })
      .then(response => response.json())
      .then(response => {
        if (response.success && response.template) {
          if (get(action, 'config.download') === false) {
            goToCardDetailsPage(response.template);
          } else {
            return DownloadAction.execute({ record: Records.get(response.template), action });
          }
        } else {
          const message =
            response.message || response.originalMessage || get(response, 'status.description', t('record-action.msg.error.title'));

          dialogManager.showInfoDialog({
            title: t('record-action.msg.info.title'),
            text: message.slice(0, message.lastIndexOf('('))
          });
        }
      });
  },

  getDefaultModel: () => ({
    name: 'record-action.name.save-as-case-template',
    type: DefaultActionTypes.SAVE_AS_CASE_TEMPLATE
  })
};
