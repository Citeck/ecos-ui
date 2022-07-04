import cloneDeep from 'lodash/cloneDeep';
import get from 'lodash/get';
import isNil from 'lodash/isNil';
import isBoolean from 'lodash/isBoolean';

import { RecordActionsApi } from '../../../../../api/recordActions';
import FormManager from '../../../../EcosForm/FormManager';
import { notifyStart, prepareBatchEditAction, prepareResult, removeNotify, ResultTypes } from '../../util/actionUtils';
import ActionsExecutor from '../ActionsExecutor';

const actionsApi = new RecordActionsApi();

const executeAction = async ({ groupAction, selected = [], excludedRecords, resolved, query = null }) => {
  const { params } = groupAction;
  let exAction;

  if (params.js_action) {
    const actionFunction = new Function('records', 'parameters', params.js_action); //eslint-disable-line

    exAction = (await actionFunction(selected, params)) || [];
  } else {
    exAction = await actionsApi.executeServerGroupAction({ action: groupAction, query, nodes: selected, excludedRecords });
  }

  if (exAction.error) {
    return {
      error: get(exAction, 'error.message') || '-',
      code: get(exAction, 'error.response.status')
    };
  }

  const result = prepareResult(exAction.results || exAction);

  if (!isBoolean(result) && get(resolved, 'length')) {
    if (result.type === ResultTypes.RESULTS || result.type === ResultTypes.LINK) {
      result.data.results = [...(result.data.results || []), ...resolved];
    }
  }

  return result;
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
        const action = cloneDeep(groupAction);
        action.params = action.params || {};
        action.params = {
          ...action.params,
          ...rec.getRawAttributes()
        };
        action.params.attributes = rec.getAttributesToSave();

        resolve(action);
      },
      onModalCancel: () => {
        resolve(null);
      }
    });
  });
};

export default class ServerGroupAction extends ActionsExecutor {
  static ACTION_ID = 'server-group-action';

  async execForRecords(records, action, context) {
    const selectedRecords = records.map(r => r.id);
    const groupAction = cloneDeep(action.config);
    let groupActionWithData;
    let result;

    groupAction.type = 'selected';

    if (!isNil(groupAction.formKey)) {
      groupActionWithData = await showFormIfRequired(groupAction);

      if (!groupActionWithData) {
        return false;
      }
    }

    if (get(groupActionWithData, ['params', 'form_option_batch-edit-attribute'])) {
      result = await prepareBatchEditAction({
        groupAction: groupActionWithData,
        selected: selectedRecords,
        callback: executeAction
      });
    } else {
      result = await executeAction({
        groupAction: groupActionWithData || groupAction,
        selected: selectedRecords
      });
    }

    return result || false;
  }

  async execForQuery(query, action, context) {
    const excludedRecords = get(context, 'excludedRecords');
    let groupAction = cloneDeep(action.config);

    groupAction.type = 'filtered';
    groupAction = await showFormIfRequired(groupAction);

    const notify = notifyStart('', 0);
    const result = await executeAction({ groupAction, query, excludedRecords });

    removeNotify(notify);

    return result || false;
  }

  isActionConfigCheckingRequired(action) {
    return !Boolean(get(action, 'generatedAction'));
  }
}
