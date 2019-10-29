import { PROXY_URI } from '../../../constants/alfresco';
import dialogManager from '../../common/dialogs/Manager';

export const CaseRequestAction = {
  execute: ({ action }) => {
    let onConfirmResult = () => {};

    const promise = new Promise(resolve => [(onConfirmResult = success => resolve(success))]);

    var makeRequest = () => {
      fetch(PROXY_URI + action.config.url, {
        method: action.config.requestMethod,
        credentials: 'include'
      })
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
            title: 'action.result.success',
            text: 'action.result.success',
            onClose: () => onConfirmResult(true)
          });
        })
        .catch(e => {
          console.error(e);
          dialogManager.showInfoDialog({
            title: 'action.result.error',
            text: 'action.result.error',
            onClose: () => onConfirmResult(false)
          });
        });
    };

    if (action.config.confirmationMessage) {
      dialogManager.confirmDialog({
        title: action.config.confirmationMessage,
        text: action.config.confirmationMessage,
        onNo: () => onConfirmResult(false),
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
      icon: 'icon-big-arrow'
    };
  }
};
