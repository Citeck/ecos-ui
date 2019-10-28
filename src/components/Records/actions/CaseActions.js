import { PROXY_URI } from '../../../constants/alfresco';
import dialogManager from '../../common/dialogs/Manager';

export const CaseRequestAction = {
  execute: ({ action }) => {
    /*

    var makeRequest = function() {
*/

    return fetch(PROXY_URI + action.config.url, {
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
          text: 'action.result.success'
        });

        return true;
      })
      .catch(e => {
        dialogManager.showInfoDialog({
          title: 'action.result.error',
          text: 'action.result.error'
        });

        return false;
      });

    /*if (props.confirmationMessage) {
      Alfresco.util.PopupManager.displayPrompt({
        title: props.title,
        text: props.confirmationMessage,
        noEscape: true,
        buttons: [
          {
            text: this.msg("button.yes"),
            handler: function dlA_onActionDelete_ok() {
              this.destroy();
              makeRequest();
            }
          },
          {
            text: this.msg("button.cancel"),
            handler: function dlA_onActionDelete_cancel() {
              this.destroy();
            },
            isDefault: true
          }]
      });
    } else {
      makeRequest();
    }


*/
  },

  getDefaultModel: () => {
    return {
      icon: 'icon-big-arrow'
    };
  }
};
