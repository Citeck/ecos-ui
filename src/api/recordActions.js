import recordActions from '../components/Records/actions';
import { CommonApi } from './common';

export class RecordActionsApi extends CommonApi {
  getActions = ({ records, context }) => {
    return recordActions.getActions(records, context);
  };

  executeAction = ({ records, action, context }) => {
    return recordActions.execAction(records, action, context);
  };
}
