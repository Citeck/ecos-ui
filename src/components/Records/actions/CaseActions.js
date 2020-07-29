import { PROXY_URI, URL_PAGECONTEXT } from '../../../constants/alfresco';
import dialogManager from '../../common/dialogs/Manager';
import { t } from '../../../helpers/util';
import ecosFetch from '../../../helpers/ecosFetch';
import { createUserActionNode } from './export/recordActions';

export const CaseRedirectAction = {
  execute: ({
    action,
    action: {
      config: { url = '', target = '_self' }
    }
  }) => {
    if (!url) {
      console.error(action);
      throw new Error('Redirect action url is missing!');
    }

    window.open(URL_PAGECONTEXT + url, target);
  }
};

export const CaseCreateNodeAction = {
  execute: ({ action }) => createUserActionNode(action.config)
};

export const CaseRequestAction = {
  execute: ({ action }) => {
    let onRequestResult = () => {};

    const promise = new Promise(resolve => [(onRequestResult = success => resolve(success))]);

    var makeRequest = () => {
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
  },

  getDefaultModel: () => {
    return {
      icon: 'icon-arrow'
    };
  }
};
