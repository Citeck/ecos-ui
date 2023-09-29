import ActionsExecutor from '../ActionsExecutor';
import logger from '../../../../../services/logger';
import Records from '../../../Records';
import LicenseService from '../../../../../services/LicenseService';
import { NotificationManager } from 'react-notifications';
import { t } from '../../../../../helpers/export/util';

const STATUS_WAITING = 'WAITING';
const STATUS_RUNNING = 'RUNNING';
const STATUS_COMPLETED = 'COMPLETED';

const ATT_STATUS = 'status?str';
const ATT_RESULT = 'result?json';

export default class ServerGroupActionV2 extends ActionsExecutor {
  static ACTION_ID = 'server-group-action-v2';

  async execForRecords(records, action, context) {
    const values = {
      type: 'records-list',
      config: {
        records: records.map(r => r.id)
      }
    };
    return this.execForValues(values, action);
  }

  async execForQuery(query, action, context) {
    const values = {
      type: 'records-query',
      config: {
        query
      }
    };
    return this.execForValues(values, action);
  }

  async execForValues(values, action) {
    const hasGroupActionsLicense = await LicenseService.hasGroupActionsFeature();
    if (!hasGroupActionsLicense) {
      NotificationManager.error(t('records-actions.server-group-actions-v2.error.license'));
      return false;
    }

    const { targetApp, type, config } = action.config || {};

    const groupActionRec = Records.get(targetApp + '/group-action@');
    groupActionRec.att('values', values);
    groupActionRec.att('action', { type, config });
    const actionId = await groupActionRec.save();

    let promiseResolve;
    let promiseReject;
    const promise = new Promise((resolve, reject) => {
      promiseResolve = resolve;
      promiseReject = reject;
    });

    const waitComplete = async () => {
      try {
        const actionAtts = await Records.get(actionId).load([ATT_STATUS, ATT_RESULT], true);
        const status = actionAtts[ATT_STATUS] || '';
        if (status === STATUS_WAITING || status === STATUS_RUNNING) {
          setTimeout(() => waitComplete(), 1000);
        } else {
          if (status === STATUS_COMPLETED) {
            promiseResolve(actionAtts[ATT_RESULT]);
          } else {
            logger.error('[ServerGroupActionV2] error', { values, action, actionAtts });
            promiseReject(new Error('Group action completed with unexpected status. Result: ' + JSON.stringify(actionAtts)));
          }
        }
      } catch (e) {
        logger.error('[ServerGroupActionV2] error', { values, action });
        promiseReject(e);
      }
    };
    waitComplete();

    return promise.finally(() => {
      Records.forget(actionId);
    });
  }
}
