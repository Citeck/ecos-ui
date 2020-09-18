import React from 'react';
import cloneDeep from 'lodash/cloneDeep';
import get from 'lodash/get';

import FormManager from '../../../../EcosForm/FormManager';
import { PROXY_URI } from '../../../../../constants/alfresco';
import { isExistValue, t } from '../../../../../helpers/util';
import { CommonApi } from '../../../../../api/common';
import Records from '../../../Records';
import { Loader } from '../../../../common';
import DialogManager from '../../../../common/dialogs/Manager';
import { EmptyGrid, Grid } from '../../../../common/grid';
import ActionsExecutor from '../ActionsExecutor';

const commonApi = new CommonApi();

const performGroupAction = async ({ groupAction, selected = [], resolved, query = null }) => {
  const { type, params } = groupAction;

  if (params.js_action) {
    var actionFunction = new Function('records', 'parameters', params.js_action); //eslint-disable-line
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

  return Promise.all([commonApi.postJson(`${PROXY_URI}api/journals/group-action`, postBody), Records.get(selected).load('.disp')])
    .then(resp => {
      let actionResults = (resp[0] || {}).results || [];
      let titles = resp[1] || [];

      titles = Array.isArray(titles) ? titles : [titles];

      let result = actionResults.map((a, i) => ({
        ...a,
        title: titles[i],
        status: t(`batch-edit.message.${a.status}`)
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
    })
    .catch(e => {
      console.error(e, groupAction, selected, resolved, query);
      return [];
    });
};

const _getPreviewRecords = async records => {
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
    const selectedRecords = records.map(r => r.id);
    const groupAction = cloneDeep(action.config);
    groupAction.type = 'selected';
    const previewRecords = await _getPreviewRecords(selectedRecords);

    const groupActionWithData = isExistValue(groupAction.formKey) ? await showFormIfRequired(groupAction) : undefined;

    this.showGroupActionResult(previewRecords, { isLoading: true });

    let result;
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

    return result ? await this.showGroupActionResult(result, { isLoading: false }) : false;
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

  async showGroupActionResult(res, options) {
    return new Promise(resolve => {
      DialogManager.showCustomDialog({
        title: 'group-action.label.header',
        body: renderPerformGroupActionResponse(res, options),
        onHide: () => resolve(true)
      });
    });
  }
}

const renderPerformGroupActionResponse = (performGroupActionResponse = [], options) => {
  const performGroupActionResponseUrl = (performGroupActionResponse[0] || {}).url;

  return (
    <div>
      {get(options, 'isLoading') && <Loader blur rounded />}
      <EmptyGrid maxItems={performGroupActionResponse.length}>
        {performGroupActionResponseUrl ? (
          <Grid
            keyField={'link'}
            data={[
              {
                status: t('group-action.label.report'),
                link: performGroupActionResponseUrl
              }
            ]}
            columns={[
              {
                dataField: 'status',
                text: t('group-action.label.status')
              },
              {
                dataField: 'link',
                text: t('actions.document.download'),
                formatExtraData: {
                  formatter: ({ cell }) => {
                    const html = `<a href="${PROXY_URI + cell}" onclick="event.stopPropagation()">${t('actions.document.download')}</a>`;
                    return <span dangerouslySetInnerHTML={{ __html: html }} />;
                  }
                }
              }
            ]}
          />
        ) : (
          <Grid
            keyField={'nodeRef'}
            data={performGroupActionResponse}
            columns={[
              {
                dataField: 'title',
                text: t('group-action.label.record')
              },
              {
                dataField: 'status',
                text: t('group-action.label.status')
              },
              {
                dataField: 'message',
                text: t('group-action.label.message')
              }
            ]}
          />
        )}
      </EmptyGrid>
    </div>
  );
};
