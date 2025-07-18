import get from 'lodash/get';

import { t } from '../../../../../helpers/util';
import { SourcesId } from '../../../../../constants';
import { PROXY_URI } from '../../../../../constants/alfresco';
import { replacePlaceholders } from '../../../../Journals/service/util';
import Records from '../../../Records';
import ActionsExecutor from '../ActionsExecutor';
import { ResultTypes } from '../../util/constants';
import LicenseService from '../../../../../services/license/LicenseService';
import ConfigService, {ALFRESCO_ENABLED, ALFRESCO_EXPORT_SRC_ID_PATTERN} from '../../../../../services/config/ConfigService';

const ALF_ACTION_ID = `${SourcesId.ACTION}@alf-download-report-group-action-`;
const ACTION_ID = `${SourcesId.ACTION}@group-action-export-`;

const Labels = {
  NO_RESULT: 'record-action.name.export-report.msg.no-result',
  NO_EXPORT_TYPE: 'record-action.name.export-report.msg.no-export-type',
  NO_COLUMNS: 'record-action.name.export-report.msg.no-columns',
  NO_EXPORT_CONFIG: 'record-action.name.export-report.msg.no-export-config',
  NO_HANDLER: 'record-action.name.export-report.msg.no-handler',
  NO_RESULT_URL: 'record-action.name.export-report.msg.done-no-url',
  NO_RESULT_TYPE: 'record-action.name.export-report.msg.done-no-type',
  SERVER_ERROR_TYPE: 'record-action.name.export-report.msg.done-no-type',
  SENDING_TO_EMAIL: 'record-action.name.export-report.msg.sending-to-email'
};

export default class RecordsExportAction extends ActionsExecutor {
  static ACTION_ID = 'records-export';

  async execForRecords(records, action, context) {
    let isLegacyGroupActionRequired = false;
    for (let record of records) {
      let id = record.id;
      let srcIdDelimIdx = id.indexOf('@');
      if (srcIdDelimIdx > 0) {
        isLegacyGroupActionRequired = await this._isLegacyGroupActionRequiredForSource(id.substring(0, srcIdDelimIdx));
        if (isLegacyGroupActionRequired) {
          break;
        }
      }
    }

    return this._execImpl(
      isLegacyGroupActionRequired,
      (handler, action) => handler.execForRecords(records, action, context),
      action,
      context
    );
  }

  async execForQuery(query, action, context) {
    return this._execImpl(
      await this._isLegacyGroupActionRequiredForSource(query.sourceId),
      (handler, action) => handler.execForQuery(query, action, context),
      action,
      context
    );
  }

  async _isLegacyGroupActionRequiredForSource(sourceId) {
    if (!sourceId) {
      return false;
    }
    const isAlfrescoEnabled = await ConfigService.getValue(ALFRESCO_ENABLED);
    if (!isAlfrescoEnabled) {
      return false;
    }
    const isGroupActionsLicenseExists = await LicenseService.hasGroupActionsFeature();
    if (!isGroupActionsLicenseExists) {
      return true;
    }
    const alfSrcIdPattern = await ConfigService.getValue(ALFRESCO_EXPORT_SRC_ID_PATTERN);
    return alfSrcIdPattern && !!sourceId.match(alfSrcIdPattern);
  }

  async _execImpl(isLegacyGroupAction, actionImpl, action) {
    try {
      const { exportType = null, columns = null, download = true, reportTitle, journalName } = action.config || {};

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

      const exportActionId = (isLegacyGroupAction ? ALF_ACTION_ID : ACTION_ID) + exportType.toLowerCase();
      const exportConfig = await Records.get(exportActionId).load('?json', true);

      if (!exportConfig) {
        throwError(Labels.NO_EXPORT_CONFIG);
      }

      const handler = this._actionsRegistry.getHandler(exportConfig.type);

      if (!handler) {
        throwError(Labels.NO_HANDLER, exportConfig);
      }

      const newAction = { ...exportConfig };
      if (isLegacyGroupAction) {
        newAction.config = replacePlaceholders(newAction.config, {
          reportColumns: columns,
          reportTitle
        });
      } else {
        let newConfig = await Records.queryOne(
          {
            sourceId: 'uiserv/fill-template-value',
            query: {
              context: {
                reportColumns: columns,
                reportTitle,
                journalName
              },
              value: newAction.config
            }
          },
          '?json'
        );

        if (!newConfig) {
          newConfig = newAction.config;
        }

        newAction.config = newConfig;
      }

      let result = await actionImpl(handler, newAction);

      if (!result) {
        throwError(Labels.NO_RESULT, newAction);
      }
      let resultType = (result.type || '').toLowerCase();
      if (resultType === 'message') {
        resultType = ResultTypes.MSG;
      }
      if (result.type !== resultType) {
        result = {
          ...result,
          type: resultType
        };
      }

      if (!result.type && result.code && result.code >= 500) {
        throwError(result.error || Labels.SERVER_ERROR_TYPE, result);
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

        if (isLegacyGroupAction) {
          const hasWorkspace = url.includes('workspace://SpacesStore/');

          if (hasWorkspace) {
            if (download === false) {
              url += url.includes('?') ? '&' : '?';
              url += 'download=false';
            }

            url = PROXY_URI + url;
          }
        } else {
          if (download === false) {
            url += url.includes('?') ? '&' : '?';
            url += 'download=false';
          }
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
