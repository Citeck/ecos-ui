import React from 'react';
import cloneDeep from 'lodash/cloneDeep';
import get from 'lodash/get';

import FormManager from '../../../../EcosForm/FormManager';
import { PROXY_URI } from '../../../../../constants/alfresco';
import { isExistValue, t } from '../../../../../helpers/util';
import { CommonApi } from '../../../../../api/common';
import Records from '../../../Records';
import DialogManager from '../../../../common/dialogs/Manager';
import ExecuteInfoGroupAction from '../../components/ExecuteInfoGroupAction';
import ActionsExecutor from '../ActionsExecutor';

const commonApi = new CommonApi();

const performGroupAction = async ({ groupAction, selected = [], resolved, query = null }) => {
  const { type, params } = groupAction;

  if (params.js_action) {
    const actionFunction = new Function('records', 'parameters', params.js_action); //eslint-disable-line
    actionFunction(selected, params);
    return Promise.resolve([]);
  }

  const postBody = {
    actionId: params.actionId,
    groupType: type,
    nodes: selected,
    params: params
  };

  if (query) {
    postBody.query = query.query;
    postBody.language = query.language;
  }

  const titles = await Records.get(selected).load('.disp');
  const exAction = await commonApi.postJson(`${PROXY_URI}api/journals/group-action`, postBody).catch(error => ({ error }));

  if (exAction.error) {
    console.error(exAction, groupAction, selected, resolved, query);
    return [{ errMessage: get(exAction, 'error.message') || '-' }];
  }

  if (get(exAction, '[0].url')) {
    return exAction.results;
  }

  const actionResults = exAction.results || [];
  const result = actionResults.map((item, i) => ({
    ...item,
    title: titles[i],
    status: t(`batch-edit.message.${item.status}`)
  }));

  if (resolved) {
    for (let rec of resolved) {
      result.push({
        ...rec,
        status: t(`batch-edit.message.${rec.status}`)
      });
    }
  }

  return result;
};

const _getPlugRecords = records => {
  return records.map(nodeRef => ({
    nodeRef,
    title: t('batch-edit.label.fetch-data'),
    status: t('batch-edit.message.started')
  }));
};

const _getPreviewRecords = records => {
  return Promise.all(
    records.map(nodeRef =>
      Records.get(nodeRef)
        .load('.disp', true)
        .then(title => ({
          title,
          nodeRef,
          status: t('batch-edit.message.in-progress')
        }))
    )
  );
};

const _performBatchEditAction = async groupActionData => {
  const { groupAction, selected, performGroupAction, query = null } = groupActionData;
  const attributeName = groupAction.params['form_option_batch-edit-attribute'];
  const params = groupAction.params || {};

  const records = await Promise.all(
    selected.map(id =>
      Records.get(id)
        .load(
          {
            valueDisp: attributeName + '?disp',
            value: attributeName + '?str',
            disp: '.disp'
          },
          true
        )
        .then(atts => {
          return { ...atts, id };
        })
    )
  );

  const resolvedRecords = [];
  const recordsToChange = [];

  const addResolved = (rec, status) => {
    resolvedRecords.push({
      title: rec.disp,
      nodeRef: rec.id,
      status: status,
      message: ''
    });
  };

  for (let rec of records) {
    const value = rec.value;

    let isEmptyValue = true;
    if (value && value instanceof Array && value.length > 0) {
      isEmptyValue = false;
    } else if (value && !(value instanceof Array)) {
      isEmptyValue = false;
    }

    if (!isEmptyValue) {
      if (params.changeExistsValue !== 'true') {
        addResolved(rec, 'SKIPPED');
      } else {
        if (params.confirmChange === 'true') {
          let confirmRes = await new Promise(resolve => {
            DialogManager.confirmDialog({
              title: t('journals.action.confirm.title'),
              text: t('journals.action.change-value.message', { name: rec.disp, value: rec.valueDisp }),
              onNo: () => resolve(false),
              onYes: () => resolve(true)
            });
          });

          if (confirmRes) {
            recordsToChange.push(rec.id);
          } else {
            addResolved(rec, 'CANCELLED');
          }
        } else {
          recordsToChange.push(rec.id);
        }
      }
    } else {
      if (params.skipEmptyValues === true) {
        addResolved(rec, 'SKIPPED');
      } else {
        recordsToChange.push(rec.id);
      }
    }
  }

  return performGroupAction({
    groupAction,
    selected: recordsToChange,
    resolved: resolvedRecords,
    query
  });
};

const showFormIfRequired = groupAction => {
  if (!groupAction.formKey) {
    return Promise.resolve(groupAction);
  }

  const formOptionPrefix = 'form_option_';

  const formOptions = {};
  const actionParams = groupAction.params || {};
  for (let key in actionParams) {
    if (actionParams.hasOwnProperty(key) && key.startsWith(formOptionPrefix)) {
      formOptions[key.substring(formOptionPrefix.length)] = actionParams[key];
    }
  }

  return new Promise(resolve => {
    FormManager.openFormModal({
      record: '@',
      formKey: groupAction.formKey,
      saveOnSubmit: false,
      options: formOptions,
      onSubmit: rec => {
        let action = cloneDeep(groupAction);
        action.params = action.params || {};

        action.params = {
          ...action.params,
          ...rec.getRawAttributes()
        };

        action.params.attributes = rec.getAttributesToSave();

        resolve(action);
      }
    });
  });
};

export default class ServerGroupAction extends ActionsExecutor {
  static ACTION_ID = 'server-group-action';

  async execForRecords(records, action, context) {
    let result;
    const selectedRecords = records.map(r => r.id);
    const groupAction = cloneDeep(action.config);
    groupAction.type = 'selected';

    const groupActionWithData = isExistValue(groupAction.formKey) ? await showFormIfRequired(groupAction) : undefined;
    const options = { isLoading: true, title: groupAction.title };

    this.showGroupActionResult(_getPlugRecords(selectedRecords), options);
    const previewRecords = await _getPreviewRecords(selectedRecords);
    this.showGroupActionResult(previewRecords, options);

    if (get(groupActionWithData, ['params', 'form_option_batch-edit-attribute'])) {
      result = await _performBatchEditAction({
        groupAction: groupActionWithData,
        selected: selectedRecords,
        performGroupAction
      });
    } else {
      result = await performGroupAction({
        groupAction: groupActionWithData || groupAction,
        selected: selectedRecords
      });
    }

    return result
      ? await new Promise(resolve =>
          this.showGroupActionResult(result, {
            ...options,
            isLoading: false,
            callback: resolve
          })
        )
      : false;
  }

  async execForQuery(query, action, context) {
    let groupAction = cloneDeep(action.config);
    groupAction.type = 'filtered';

    groupAction = await showFormIfRequired(groupAction);

    performGroupAction({
      groupAction,
      query
    }).then(() => {
      return new Promise(resolve => {
        DialogManager.showInfoDialog({
          title: 'group-action.label.started',
          onClose: resolve
        });
      });
    });
  }

  showGroupActionResult(data, options) {
    DialogManager.showCustomDialog({
      title: t('group-action.label.header', { action: options.title }),
      body: <ExecuteInfoGroupAction data={data} options={options} />,
      onHide: () => {
        options.callback && options.callback(false);
      }
    });
  }

  isActionConfigCheckingRequired(action) {
    return false;
  }
}
