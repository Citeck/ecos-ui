import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import isString from 'lodash/isString';

import recordActions from '../components/Records/actions/recordActions';
import { PROXY_URI } from '../constants/alfresco';

import { CommonApi } from './common';

export class RecordActionsApi extends CommonApi {
  getActions = ({ records, context }) => {
    if (Array.isArray(records)) {
      let actionsForRecords = recordActions.getActionsForRecords(records, context.actions, context);
      return actionsForRecords.forRecord || {};
    } else {
      return recordActions.getActionsForRecord(records, context.actions, context);
    }
  };

  getActionProps = ({ action }) => {
    return recordActions.getActionProps(action);
  };

  executeAction = ({ records, action, context }) => {
    let result;
    if (Array.isArray(records)) {
      result = recordActions.execForRecords(records, action, context || {});
    } else if (isString(records)) {
      result = recordActions.execForRecord(records, action, context || {});
    } else {
      result = recordActions.execForQuery(records, action, context || {});
    }
    return result.catch(e => {
      console.error(e);
      return false;
    });
  };

  executeServerGroupAction = ({ action, query, nodes, excludedRecords }) => {
    const { type, params } = action;

    const postBody = {
      actionId: params.actionId,
      groupType: type,
      nodes,
      params
    };

    if (query) {
      postBody.query = query.query;
      postBody.language = query.language;
      postBody.sortBy = query.sortBy;
      postBody.sourceId = query.sourceId;
      postBody.consistency = query.consistency;
    }

    if (!isEmpty(excludedRecords)) {
      postBody.excludedRecords = excludedRecords;
    }

    return this.postJson(`${PROXY_URI}api/journals/group-action`, postBody).catch(async error => {
      const err = await error.response.json();
      const errorResp = { error };

      const errorObject = {
        error: {
          message: err.message || get(errorResp, 'error.response.statusText'),
          response: {
            status: err.status.code
          }
        }
      };

      return errorObject;
    });
  };
}
