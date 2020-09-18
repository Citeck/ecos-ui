import ActionsExecutor from '../ActionsExecutor';
import ecosFetch from '../../../../../helpers/ecosFetch';
import { getTemplateUrl, goToCardDetailsPage } from '../../../../../helpers/urls';
import get from 'lodash/get';
import Records from '../../../Records';
import { t } from '../../../../../helpers/export/util';
import dialogManager from '../../../../common/dialogs/Manager/DialogManager';
import DownloadAction from './DownloadAction';
import actionsRegistry from '../../actionsRegistry';

export default class SaveAsCaseTemplateAction extends ActionsExecutor {
  static ACTION_ID = 'save-as-case-template';

  async execForRecord(record, action, context) {
    const downloadAction = actionsRegistry.getHandler(DownloadAction.ACTION_ID);

    return ecosFetch(getTemplateUrl(record.id), { method: 'POST' })
      .then(response => response.json())
      .then(response => {
        if (response.success && response.template) {
          if (get(action, 'config.download') === false) {
            goToCardDetailsPage(response.template);
          } else {
            return downloadAction.execForRecord(Records.get(response.template), action);
          }
        } else {
          const message =
            response.message || response.originalMessage || get(response, 'status.description', t('record-action.msg.error.title'));

          dialogManager.showInfoDialog({
            title: t('record-action.msg.info.title'),
            text: message.slice(0, message.lastIndexOf('('))
          });
        }
      });
  }

  getDefaultActionModel() {
    return {
      name: 'record-action.name.save-as-case-template',
      icon: 'icon-custom-file-empty'
    };
  }
}
