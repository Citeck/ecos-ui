import React from 'react';
import { NotificationManager } from 'react-notifications';
import isEmpty from 'lodash/isEmpty';
import get from 'lodash/get';
import * as queryString from 'query-string';

import {
  createPrintUrl,
  getDownloadContentUrl,
  getTemplateUrl,
  goToCardDetailsPage,
  goToJournalsPage,
  goToNodeEditPage
} from '../../../helpers/urls';
import { getTimezoneValue, isExistValue, t } from '../../../helpers/util';
import ecosFetch from '../../../helpers/ecosFetch';
import { ActionModes, SourcesId } from '../../../constants';
import { URL_PAGECONTEXT } from '../../../constants/alfresco';
import { TasksApi } from '../../../api/tasks';
import WidgetService from '../../../services/WidgetService';
import EcosFormUtils from '../../EcosForm/EcosFormUtils';
import dialogManager from '../../common/dialogs/Manager';
import TaskAssignmentPanel from '../../TaskAssignmentPanel/TaskAssignmentPanel';
import Records from '../Records';
import RecordActions from './RecordActions';

function notifySuccess(msg) {
  NotificationManager.success(msg || t('record-action.msg.success.text'), t('record-action.msg.success.title'));
}

function notifyFailure(msg) {
  NotificationManager.error(msg || t('record-action.msg.error.text'), t('record-action.msg.error.title'), 5000);
}

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
  SAVE_AS_CASE_TEMPLATE: 'save-as-case-template',
  PREVIEW_MODAL: 'content-preview-modal',
  FETCH: 'fetch',
  SCRIPT: 'script',
  EDIT_TASK_ASSIGNEE: 'edit-task-assignee',
  VIEW_BUSINESS_PROCESS: 'view-business-process',
  CANCEL_BUSINESS_PROCESS: 'cancel-business-process',
  MUTATE: 'mutate'
};

export const EditAction = {
  execute: ({ record, action: { config = {} } }) => {
    if (config.mode === 'task') {
      return record.load('cm:name?str').then(taskId => {
        if (!taskId) {
          console.error('Task ID is not found for record', record);
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
            onCancel: () => resolve(false)
          });
        });
      });
    }

    return new Promise(resolve => {
      EcosFormUtils.editRecord({
        recordRef: record.id,
        attributes: config.attributes || {},
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
  }
};

const goToTaskView = (task, inBackground) => {
  let taskRecord = Records.get(task);

  taskRecord.load('wfm:document?id').then(docId => {
    if (docId) {
      goToCardDetailsPage(docId, { openInBackground: inBackground });
    } else {
      taskRecord.load('cm:name?str').then(taskId => {
        if (!taskId) {
          console.error('Task Id is not found!');
          notifyFailure();
          return;
        }
        const taskRecordId = `${SourcesId.TASK}@${taskId}`;
        Records.get(taskRecordId)
          .load('workflow?id')
          .then(workflowId => {
            goToCardDetailsPage(workflowId || taskRecordId, { openInBackground: inBackground });
          });
      });
    }
  });
};

export const ViewAction = {
  disabledFor: [/^event-lines.*/, /task-statistic/],

  execute: ({ record, action: { config = {} } }) => {
    if (config.viewType === 'task-document-dashboard') {
      Records.get(record.id)
        .load('wfm:document?id')
        .then(docId => (docId ? goToCardDetailsPage(docId) : ''));
      return false;
    } else if (config.viewType === 'view-task') {
      goToTaskView(record.id, false);
      return false;
    }

    goToCardDetailsPage(record.id);
    return false;
  },

  getDefaultModel: () => {
    return {
      name: 'record-action.name.show',
      type: DefaultActionTypes.VIEW,
      icon: 'icon-small-eye-show'
    };
  },

  canBeExecuted: ({ context = {} }) => {
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
      type: OpenURL.type,
      icon: 'icon-new-tab'
    };
  }
};

export const BackgroundOpenAction = {
  type: DefaultActionTypes.OPEN_IN_BACKGROUND,

  disabledFor: [/^event-lines.*/, /task-statistic/],

  execute: ({ record, action: { context = {}, config = {} } }) => {
    if (config.viewType === 'view-task') {
      goToTaskView(record.id, true);
      return false;
    }

    goToCardDetailsPage(record.id, { openInBackground: true });
    return false;
  },

  getDefaultModel: () => {
    return {
      name: 'record-action.name.open-in-background',
      type: BackgroundOpenAction.type,
      icon: 'icon-new-tab'
    };
  },

  canBeExecuted: ({ context = {} }) => {
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

    if (config.downloadType === 'base64') {
      record.load(config.attribute || 'data').then(data => {
        let filename = config.filename;
        if (!filename) {
          filename = record.id;
          if (filename.indexOf('@') > 0) {
            filename = filename.substring(filename.indexOf('@') + 1);
          }
          if (filename.indexOf('$') > 0) {
            filename = filename.substring(filename.indexOf('$') + 1);
          }
          if (config.extension) {
            filename += '.' + config.extension;
          }
        }
        DownloadAction._downloadBase64(data, filename);
      });
    } else if (config.downloadType === 'ecos_module') {
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

  _downloadBase64: (base64, filename) => {
    const dataStr = 'data:application/octet-stream;charset=utf-8;base64,' + base64;
    DownloadAction._downloadDataStr(dataStr, filename);
  },

  _downloadText: (text, filename, mimetype) => {
    const dataStr = 'data:' + mimetype + ';charset=utf-8,' + encodeURIComponent(text);
    DownloadAction._downloadDataStr(dataStr, filename);
  },

  _downloadDataStr: (dataStr, filename) => {
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute('href', dataStr);
    downloadAnchorNode.setAttribute('download', filename);
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }
};

export const DeleteAction = {
  disabledFor: [/^event-lines.*/],

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

  canBeExecuted: ({ context = {} }) => {
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
      icon: 'icon-small-arrow-right'
    };
  },

  canBeExecuted: ({ context = {} }) => {
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
  type: DefaultActionTypes.CREATE,

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
          const { redirectToPage = true } = config;

          record.update();
          resolve(true);

          if (redirectToPage) {
            record.id && goToCardDetailsPage(record.id);
          }
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
      icon: 'icon-small-plus'
    };
  }
};

export const UploadNewVersion = {
  execute: ({ record }) => {
    WidgetService.uploadNewVersion({ record });
  },

  getDefaultModel: () => {
    return {
      name: 'record-action.name.upload-new-version',
      type: DefaultActionTypes.UPLOAD_NEW_VERSION,
      icon: 'icon-upload'
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
          notifyFailure(t('record-action.assoc-action.not-found'));
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
    icon: 'icon-new-tab'
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
    type: DefaultActionTypes.SAVE_AS_CASE_TEMPLATE,
    icon: 'icon-custom-file-empty'
  })
};

export const PreviewModal = {
  type: DefaultActionTypes.PREVIEW_MODAL,
  execute: ({ record }) => {
    WidgetService.openPreviewModal({ recordId: record.id });
    return false;
  },
  getDefaultModel: () => ({
    name: 'record-action.name.preview',
    type: DefaultActionTypes.PREVIEW_MODAL,
    icon: 'icon-eye-show'
  })
};

export const FetchAction = {
  execute: ({ action: { config } }) => {
    const { url, args, ...options } = config || {};
    const fullUrl = `${url}?${queryString.stringify({ ...args })}`;

    return ecosFetch(fullUrl, options)
      .then(response => (response.ok ? response : Promise.reject({ message: response.statusText })))
      .then(result => {
        notifySuccess();
        return result;
      })
      .catch(e => {
        notifyFailure();
        dialogManager.showInfoDialog({ title: t('error'), text: e.message });
      });
  },

  getDefaultModel: () => ({
    name: 'record-action.name.fetch-action',
    type: DefaultActionTypes.FETCH,
    icon: 'icon-small-right'
  })
};

export const ScriptAction = {
  execute: (context = {}) => {
    let config = get(context, 'action.config', {});

    if (config.module) {
      return new Promise(resolve => {
        window.require(
          [config.module],
          module => {
            const result = module.default.execute(context);

            if (result) {
              if (result.then) {
                result
                  .then(res => resolve(res))
                  .catch(e => {
                    console.error(e);
                    resolve(true);
                  });
              } else {
                resolve(result);
              }
            } else {
              resolve(true);
            }
          },
          error => {
            console.error(error);
            notifyFailure();
            resolve(false);
          }
        );
      });
    } else {
      console.error('Module is not specified!');
      notifyFailure('record-action.script-action.error.text');
      return false;
    }
  },

  getDefaultModel: () => {
    return {
      name: 'record-action.name.script-action',
      type: DefaultActionTypes.SCRIPT,
      icon: 'icon-small-check'
    };
  }
};

export const EditTaskAssignee = {
  execute: ({ record, action: { actionOfAssignment } }) => {
    const taskId = record.id;

    const actorsPromise = TasksApi.getTask(taskId, 'actors[]?id');

    const _selectPromise = defaultValue =>
      new Promise(resolve => WidgetService.openSelectOrgstructModal({ defaultValue, onSelect: resolve }));

    const _assignPromise = owner => TasksApi.staticChangeAssigneeTask({ taskId, owner, action: actionOfAssignment });

    return actorsPromise
      .then(_selectPromise)
      .then(_assignPromise)
      .then(success => {
        if (success) {
          notifySuccess();
          return success;
        }

        return Promise.reject();
      })
      .catch(e => {
        console.error(e);
        notifyFailure();
        return false;
      });
  },

  getDefaultModel: () => {
    return {
      name: 'record-action.name.edit-task-assignee',
      type: DefaultActionTypes.EDIT_TASK_ASSIGNEE,
      icon: 'icon-edit'
    };
  }
};

export const ViewBusinessProcess = {
  execute: ({ record, action = {} }) => {
    const workflowIdPromise = action.workflowFromRecord ? Records.get(record).load('workflow?id') : Promise.resolve(record);

    const _workflowInfoPromise = recordId =>
      Records.get(recordId)
        .load({ name: '.disp', version: 'version' })
        .then(info => ({ ...info, recordId }));

    const _viewPromise = info =>
      new Promise(resolve => {
        WidgetService.openBusinessProcessModal({ ...info, onClose: resolve });
      });

    return workflowIdPromise
      .then(_workflowInfoPromise)
      .then(_viewPromise)
      .catch(e => {
        console.error(e);
        notifyFailure();
        return false;
      });
  },

  getDefaultModel: () => {
    return {
      name: 'record-action.name.view-business-process',
      type: DefaultActionTypes.VIEW_BUSINESS_PROCESS,
      icon: 'icon-models'
    };
  }
};

export const CancelBusinessProcess = {
  execute: ({ record }) => {
    const rec = Records.get(record);
    rec.att('cancel', true);

    return rec
      .save()
      .then(record => {
        if (!isExistValue(record)) {
          return;
        }

        if (record.id) {
          notifySuccess();
          return true;
        }

        return Promise.reject();
      })
      .catch(e => {
        console.error(e);
        notifyFailure();
        e && e.message && dialogManager.showInfoDialog({ title: t('error'), text: e.message });
        return false;
      });
  },

  getDefaultModel: () => {
    return {
      name: 'record-action.name.cancel-business-process',
      type: DefaultActionTypes.CANCEL_BUSINESS_PROCESS,
      icon: 'icon-small-close'
    };
  }
};

export const MutateAction = {
  execute: ({ record, action }) => {
    const recordId = get(action, 'config.record.id');
    const attributes = get(action, 'config.record.attributes') || {};
    const _record = recordId ? Records.get(recordId) : record;

    for (let att in attributes) {
      if (attributes.hasOwnProperty(att)) {
        _record.att(att, attributes[att]);
      }
    }

    return _record
      .save()
      .then(() => {
        notifySuccess();
        return true;
      })
      .catch(e => {
        console.error(e);
        notifyFailure();
        e && e.message && dialogManager.showInfoDialog({ title: t('error'), text: e.message });
        return false;
      });
  },

  getDefaultModel: () => {
    return {
      name: 'record-action.name.mutate-action',
      type: DefaultActionTypes.MUTATE,
      icon: 'icon-arrow'
    };
  }
};
