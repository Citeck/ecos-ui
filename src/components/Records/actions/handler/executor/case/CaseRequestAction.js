import ActionsExecutor from '../../ActionsExecutor';
import { PROXY_URI } from '../../../../../../constants/alfresco';
import ecosFetch from '../../../../../../helpers/ecosFetch';
import dialogManager from '../../../../../common/dialogs/Manager/DialogManager';
import { t } from '../../../../../../helpers/export/util';

export default class CaseRedirectAction extends ActionsExecutor {
  static ACTION_ID = 'REQUEST';

  async execForRecord(record, action, context) {
    let onRequestResult = () => {};

    const promise = new Promise(resolve => [(onRequestResult = success => resolve(success))]);

    const makeRequest = () => {
      ecosFetch(PROXY_URI + action.config.url, { method: action.config.requestMethod })
        .then(response => {
          return response.json().then(body => {
            if (response.status >= 200 && response.status < 300) {
              return body;
            }
            if (body.message) {
              throw new Error(body.message);
            } else {
              throw new Error(response.statusText);
            }
          });
        })
        .then(() => {
          dialogManager.showInfoDialog({
            title: t('record-action.msg.success.title'),
            text: t('record-action.msg.success.text'),
            onClose: () => onRequestResult(true)
          });
        })
        .catch(e => {
          dialogManager.showInfoDialog({
            title: t('record-action.msg.error.title'),
            text: e.message,
            onClose: () => onRequestResult(false)
          });
        });
    };

    if (action.config.confirmationMessage) {
      dialogManager.confirmDialog({
        title: t('record-action.msg.confirm.title'),
        text: t(action.config.confirmationMessage),
        onNo: () => onRequestResult(false),
        onYes: makeRequest
      });
    } else {
      makeRequest();
    }

    return promise.then(result => {
      if (result) {
        window.location.reload();
      }
      return result;
    });
  }

  getDefaultActionModel() {
    return {
      icon: 'icon-small-arrow-right'
    };
  }
}
