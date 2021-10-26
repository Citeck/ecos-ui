import get from 'lodash/get';

import { replacePlaceholders } from '../../../../Journals/service/util';
import { SourcesId } from '../../../../../constants';
import { PROXY_URI } from '../../../../../constants/alfresco';
import Records from '../../../Records';
import ActionsExecutor from '../ActionsExecutor';

const ACTION_ID = `${SourcesId.ACTION}@alf-download-report-group-action-`;

export default class RecordsExportAction extends ActionsExecutor {
  static ACTION_ID = 'records-export';

  async execForRecords(records, action, context) {
    return this._execImpl((handler, action) => handler.execForRecords(records, action, context), action, context);
  }

  async execForQuery(query, action, context) {
    return this._execImpl((handler, action) => handler.execForQuery(query, action, context), action, context);
  }

  async _execImpl(actionImpl, action) {
    const { exportType = null, columns = null, download = true } = action.config || {};

    const throwError = msg => {
      const args = [action];

      for (let i = 1; i < arguments.length; i++) {
        args.push(arguments[i]);
      }

      console.error(`[RecordsExportAction] ${msg}`, args);
      throw new Error(msg);
    };

    if (!exportType) {
      throwError('exportType in action.config is empty');
    }

    if (!columns || columns.length === 0) {
      throwError('columns in action.config is empty');
    }

    const exportActionId = ACTION_ID + exportType.toLowerCase();
    const exportConfig = await Records.get(exportActionId).load('?json', true);

    if (!exportConfig) {
      throwError("Export action config doesn't found");
    }

    const handler = this._actionsRegistry.getHandler(exportConfig.type);

    if (!handler) {
      throwError("Action handler doesn't exists", exportConfig);
    }

    const newAction = { ...exportConfig };

    newAction.config = replacePlaceholders(newAction.config, { reportColumns: columns });

    const result = await actionImpl(handler, newAction);

    if (!result) {
      throwError('Empty result', newAction);
    }

    if (result.type === 'link') {
      let url = get(result, 'data.url', '');

      if (!url) {
        throwError('Result is not empty and has type link, but data.url is missing', result);
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
    } else {
      throwError('Unknown type of result: ' + result.type);
    }

    return false;
  }

  getDefaultActionModel() {
    return {
      name: 'Export report',
      icon: 'icon-download'
    };
  }
}
