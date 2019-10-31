import { PROXY_URI } from '../../../constants/alfresco';
import dialogManager from '../../common/dialogs/Manager';
import EcosFormUtils from '../../EcosForm/EcosFormUtils';

export const CaseCreateNodeAction = {
  execute: ({ action }) => {
    return new Promise(resolve => {
      let config = action.config;
      let recordRef = 'dict@' + config.nodeType;

      try {
        EcosFormUtils.eform(recordRef, {
          params: {
            onSubmit: () => resolve(true),
            onFormCancel: () => resolve(false),
            attributes: {
              _parent: config.destination,
              _parentAtt: config.destinationAssoc
            }
          },
          class: 'ecos-modal_width-lg',
          isBigHeader: true
        });
      } catch (e) {
        console.error(e);
        resolve(false);
      }
    });
  }
};

export const CaseRequestAction = {
  execute: ({ action }) => {
    let onRequestResult = () => {};

    const promise = new Promise(resolve => [(onRequestResult = success => resolve(success))]);

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
            onClose: () => onRequestResult(true)
          });
        })
        .catch(e => {
          console.error(e);
          dialogManager.showInfoDialog({
            title: 'action.result.error',
            text: 'action.result.error',
            onClose: () => onRequestResult(false)
          });
        });
    };

    if (action.config.confirmationMessage) {
      dialogManager.confirmDialog({
        title: action.config.confirmationMessage,
        text: action.config.confirmationMessage,
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
      icon: 'icon-big-arrow'
    };
  }
};
