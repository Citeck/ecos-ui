import Records from '../../../Records';
import ActionsExecutor from '../ActionsExecutor';
import { replacePlaceholders } from '../../../../Journals/service/util';
import _ from 'lodash';

export default class EditPasswordAction extends ActionsExecutor {
  static ACTION_ID = 'records-export';

  async execForRecords(records, action, context) {
    return this._execImpl(
      (handler, action) => {
        return handler.execForRecords(records, action, context);
      },
      action,
      context
    );
  }

  async execForQuery(query, action, context) {
    return this._execImpl(
      (handler, action) => {
        return handler.execForQuery(query, action, context);
      },
      action,
      context
    );
  }

  async _execImpl(actionImpl, action) {
    const { exportType = null, columns = null, download = true } = action.config || {};

    const throwError = msg => {
      const args = [action];
      for (let i = 1; i < arguments.length; i++) {
        args.push(arguments[i]);
      }
      console.error(msg, args);
      throw new Error(msg);
    };

    if (!exportType) {
      throwError('exportType is empty');
    }
    if (!columns || columns.length === 0) {
      throwError('columns is empty');
    }

    const exportActionId = 'uiserv/action@alf-download-report-group-action-' + exportType.toLowerCase();
    const exportConfig = await Records.get(exportActionId).load('?json', true);

    if (!exportConfig) {
      throwError("export action config doesn't found");
    }

    const handler = this._actionsRegistry.getHandler(exportConfig.type);
    if (!handler) {
      throwError("Action handler doesn't exists", exportConfig);
    }

    const newAction = {
      ...exportConfig
    };
    newAction.config = replacePlaceholders(newAction.config, { reportColumns: columns });

    const result = await actionImpl(handler, newAction);

    if (!result) {
      throwError('Empty result', newAction);
    }

    if (result.type === 'link') {
      let url = _.get(result, 'data.url', '');
      if (!url) {
        throwError('Result is not empty and has type link, but data.url is missing', result);
      }
      const workspaceIdx = url.indexOf('workspace://SpacesStore/');
      if (workspaceIdx > -1) {
        if (download === false) {
          if (url.indexOf('?') === -1) {
            url += '?';
          } else {
            url += '&';
          }
          url += 'download=false';
        }
        window.open('/gateway/alfresco/alfresco/s/' + url);
      } else {
        window.open(url);
      }
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
