import RecordActions from '../components/Records/actions';
import { CommonApi } from './common';

export class RecordActionsApi extends CommonApi {
  getActions = ({ records, context }) => {
    return RecordActions.getActions(records, context);
  };

  executeAction = ({ records, action, context }) => {
    return RecordActions.execAction(records, action, context);
  };
}
