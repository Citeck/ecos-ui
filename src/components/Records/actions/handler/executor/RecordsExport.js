import get from 'lodash/get';

import { t } from '../../../../../helpers/util';
import { SourcesId } from '../../../../../constants';
import { PROXY_URI } from '../../../../../constants/alfresco';
import { replacePlaceholders } from '../../../../Journals/service/util';
import Records from '../../../Records';
import ActionsExecutor from '../ActionsExecutor';
import { ResultTypes } from '../../util/actionUtils';

const ACTION_ID = `${SourcesId.ACTION}@alf-download-report-group-action-`;

const Labels = {
  NO_RESULT: 'record-action.name.export-report.msg.no-result',
  NO_EXPORT_TYPE: 'record-action.name.export-report.msg.no-export-type',
  NO_COLUMNS: 'record-action.name.export-report.msg.no-columns',
  NO_EXPORT_CONFIG: 'record-action.name.export-report.msg.no-export-config',
  NO_HANDLER: 'record-action.name.export-report.msg.no-handler',
  NO_RESULT_URL: 'record-action.name.export-report.msg.done-no-url',
  NO_RESULT_TYPE: 'record-action.name.export-report.msg.done-no-type',
  SENDING_TO_EMAIL: 'record-action.name.export-report.msg.sending-to-email'
};

export default class RecordsExportAction extends ActionsExecutor {
  static ACTION_ID = 'records-export';

  async execForRecords(records, action, context) {
    return this._execImpl((handler, action) => handler.execForRecords(records, action, context), action, context);
  }

  async execForQuery(query, action, context) {
    return this._execImpl((handler, action) => handler.execForQuery(query, action, context), action, context);
  }

  async _execImpl(actionImpl, action) {
    try {
      const { exportType = null, columns = null, download = true } = action.config || {};
      const throwError = msg => {
        const args = [action];

        for (let i = 1; i < arguments.length; i++) {
          args.push(arguments[i]);
        }

        console.error('[RecordsExportAction]', t(msg), args);
        throw new Error(t(msg));
      };

      if (!exportType) {
        throwError(Labels.NO_EXPORT_TYPE);
      }

      if (!columns || columns.length === 0) {
        throwError(Labels.NO_COLUMNS);
      }

      const exportActionId = ACTION_ID + exportType.toLowerCase();
      const exportConfig = await Records.get(exportActionId).load('?json', true);

      if (!exportConfig) {
        throwError(Labels.NO_EXPORT_CONFIG);
      }

      const handler = this._actionsRegistry.getHandler(exportConfig.type);

      if (!handler) {
        throwError(Labels.NO_HANDLER, exportConfig);
      }

      const newAction = { ...exportConfig };

      newAction.config = replacePlaceholders(newAction.config, { reportColumns: columns });

      const result = await actionImpl(handler, newAction);

      if (!result) {
        throwError(Labels.NO_RESULT, newAction);
      }

      if (!Object.values(ResultTypes).includes(result.type)) {
        throwError(Labels.NO_RESULT_TYPE, result);
      }

      if (get(exportConfig, 'config.params.output.type') === 'email') {
        return {
          type: ResultTypes.INFO,
          data: t(Labels.SENDING_TO_EMAIL)
        };
      }

      if (result.type === ResultTypes.LINK) {
        let url = get(result, 'data.url', '');

        if (!url) {
          throwError(Labels.NO_RESULT_URL, result);
        }

        const hasWorkspace = url.includes('workspace://SpacesStore/');

        if (hasWorkspace) {
          if (download === false) {
            url += url.includes('?') ? '&' : '?';
            url += 'download=false';
          }

          url = PROXY_URI + url;
        }

        window.open(url);
        return true;
      }

      if (result.type === ResultTypes.RESULTS && get(result, 'data.results.length') === 1) {
        return { type: ResultTypes.MSG, data: get(result, 'data.results[0]') };
      }

      return result;
    } catch (e) {
      return { error: e.message };
    }
  }

  getDefaultActionModel() {
    return {
      name: 'record-action.name.export-report',
      icon: 'icon-download'
    };
  }
}
