import RecordActions from '../components/Records/actions';
import { CommonApi } from './common';

export class RecordActionsApi extends CommonApi {
  getActions = ({ records, context }) => {
    return RecordActions.getActions(records, context).catch(() => []);
  };

  executeAction = ({ records, action }) => {
    return RecordActions.execAction(records, action)
      .then(response => response)
      .catch(() => false);
  };
}
