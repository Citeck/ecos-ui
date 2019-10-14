import { URL_SERVICECONTEXT, URL_RESCONTEXT } from '../constants/alfresco';
import { t } from '../helpers/util';
import { goToCardDetailsPage } from '../helpers/urls';
import { showModal, hideModal } from '../actions/modal';

import { leaveSiteRequest, joinSiteRequest, becomeSiteManagerRequest, requestSiteMembership } from '../actions/handleControl';
import FormManager from '../components/EcosForm/FormManager';

export default function handleControl(type, payload, dispatch) {
  switch (type) {
    case 'ALF_DOLOGOUT':
      fetch(URL_SERVICECONTEXT + 'dologout', {
        method: 'POST'
      }).then(() => {
        window.location.reload();
      });
      break;

    case 'ALF_SHOW_MODAL_MAKE_UNAVAILABLE':
      return window.Citeck.forms.dialog('deputy:selfAbsenceEvent', '', {
        fn: function(node) {
          handleControl('ALF_NAVIGATE_TO_PAGE', {
            url: payload.targetUrl
          });
        }
      });

    case 'ALF_NAVIGATE_TO_PAGE':
      // TODO improve it
      // if (payload.targetUrlType === 'FULL_PATH')
      if (payload.target && payload.target === '_blank') {
        window.open(payload.url, '_blank');
      } else {
        window.location.href = payload.url;
      }
      break;

    case 'ALF_CREATE_SITE':
      if (window.Alfresco && window.Alfresco.module && typeof window.Alfresco.module.getCreateSiteInstance === 'function') {
        window.Alfresco.module.getCreateSiteInstance().show();
      } else {
        const legacyCreateSiteResource =
          URL_RESCONTEXT + 'modules/create-site' + (process.env.NODE_ENV === 'development' ? '.js' : '-min.js');
        window.require([legacyCreateSiteResource], function() {
          window.Alfresco.module.getCreateSiteInstance().show();
        });
      }

      break;

    case 'ALF_EDIT_SITE':
      if (window.Alfresco && window.Alfresco.module && typeof window.Alfresco.module.getEditSiteInstance === 'function') {
        window.Alfresco.module.getEditSiteInstance().show({
          shortName: payload.site
        });
      } else {
        const legacyEditSiteResource = URL_RESCONTEXT + 'modules/edit-site' + (process.env.NODE_ENV === 'development' ? '.js' : '-min.js');
        window.require([legacyEditSiteResource], function() {
          window.Alfresco.module.getEditSiteInstance().show({
            shortName: payload.site
          });
        });
      }

      break;

    case 'ALF_LEAVE_SITE':
      dispatch(
        showModal({
          title: t('message.leave', { '0': payload.siteTitle }),
          content: t('message.leave-site-prompt', { '0': payload.siteTitle }),
          buttons: [
            {
              label: t('button.leave-site.cancel-label'),
              isCloseButton: true
            },
            {
              label: t('button.leave-site.confirm-label'),
              onClick: () => {
                dispatch(leaveSiteRequest(payload));
                dispatch(hideModal());
              },
              className: 'button_blue'
            }
          ]
        })
      );
      break;

    case 'ALF_JOIN_SITE':
      dispatch(joinSiteRequest(payload));
      break;

    case 'ALF_BECOME_SITE_MANAGER':
      dispatch(becomeSiteManagerRequest(payload));
      break;

    case 'ALF_REQUEST_SITE_MEMBERSHIP':
      dispatch(requestSiteMembership(payload));
      break;

    case 'ECOS_CREATE_VARIANT':
      FormManager.createRecordByVariant(payload, {
        onSubmit: record => {
          goToCardDetailsPage(record.id);
        }
      });
      break;

    default:
      console.log('Unknown control type: ', type);
  }
}
