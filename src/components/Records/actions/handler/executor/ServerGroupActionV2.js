import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import ActionsExecutor from '../ActionsExecutor';
import logger from '../../../../../services/logger';
import Records from '../../../Records';
import LicenseService from '../../../../../services/license/LicenseService';
import { NotificationManager } from 'react-notifications';

import { t } from '../../../../../helpers/export/util';
import { notifyStart, removeNotify } from '../../util/actionUtils';
import { ResultTypes } from '../../util/constants';

const STATUS_WAITING = 'WAITING';
const STATUS_RUNNING = 'RUNNING';
const STATUS_COMPLETED = 'COMPLETED';

const ATT_STATUS = 'status?str';
const ATT_RESULT = 'result?json';
const ATT_TOTAL_COUNT = 'totalCount?num';
const ATT_PROCESSED_COUNT = 'processedCount?num';

const WAITING_DELAY_TIME = [200, 500, 1000, 2000, 3000, 4000, 5000];

const Labels = {
  SENDING_TO_EMAIL: 'record-action.name.export-report.msg.sending-to-email'
};

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

    const { targetApp, executionParams = {}, valuesParams = {}, outputParams = {} } = action.config || {};

    const actionValuesParams = { ...valuesParams, ...values };
    const actionExecutionParams = { ...executionParams };
    const actionOutputParams = { ...outputParams };

    const groupActionRec = Records.get(targetApp + '/group-action@');
    groupActionRec.att('values', actionValuesParams);
    groupActionRec.att('execution', actionExecutionParams);

    if (!isEmpty(actionOutputParams) && actionOutputParams.type) {
      groupActionRec.att('output', actionOutputParams);
    }

    const actionId = await groupActionRec.save();

    let notify;
    let promiseResolve;
    let promiseReject;
    const promise = new Promise((resolve, reject) => {
      promiseResolve = resolve;
      promiseReject = reject;
    });

    let dialog;

    if (get(actionOutputParams, 'type', '').toLowerCase() === 'email') {
      return {
        type: ResultTypes.INFO,
        data: t(Labels.SENDING_TO_EMAIL)
      };
    } else {
      notify = notifyStart('');
    }

    const waitComplete = async iteration => {
      try {
        const actionAtts = await Records.get(actionId).load([ATT_STATUS, ATT_RESULT, ATT_TOTAL_COUNT, ATT_PROCESSED_COUNT], true);

        const status = actionAtts[ATT_STATUS] || '';
        if (status === STATUS_WAITING || status === STATUS_RUNNING) {
          let timeoutIdx = iteration;
          if (WAITING_DELAY_TIME.length <= timeoutIdx) {
            timeoutIdx = WAITING_DELAY_TIME.length - 1;
          }
          setTimeout(() => waitComplete(iteration + 1), WAITING_DELAY_TIME[timeoutIdx]);
        } else {
          if (status === STATUS_COMPLETED) {
            let result = actionAtts[ATT_RESULT];
            if (result && result.type) {
              result.type = result.type.toLowerCase();
            }
            promiseResolve(result);
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
    waitComplete(0);

    return promise.finally(() => {
      if (dialog) {
        dialog.setVisible(false);
      }
      if (notify) {
        removeNotify(notify);
      }
      Records.forget(actionId);
    });
  }
}
