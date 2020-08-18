import recordActions from '../components/Records/actions/recordActions';
import { CommonApi } from './common';
import isString from 'lodash/isString';

export class RecordActionsApi extends CommonApi {
  getActions = ({ records, context }) => {
    if (Array.isArray(records)) {
      let actionsForRecords = recordActions.getActionsForRecords(records, context.actions, context);
      return actionsForRecords.forRecord || {};
    } else {
      return recordActions.getActionsForRecord(records, context.actions, context);
    }
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
}
