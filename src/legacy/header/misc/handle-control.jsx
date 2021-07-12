import { t } from '../../common/util';
import { becomeSiteManagerRequest, hideModal, joinSiteRequest, leaveSiteRequest, requestSiteMembership, showModal } from '../actions';
import newHandleControl from '../../../helpers/handleControl';

const Alfresco = window.Alfresco || {};
const Citeck = window.Citeck || {};

export default function handleControl(type, payload, dispatch) {
  switch (type) {
    case 'ALF_DOLOGOUT':
      fetch(Alfresco.constants.URL_SERVICECONTEXT + 'dologout', {
        method: 'POST'
      }).then(() => {
        window.location.reload();
      });
      break;

    case 'ALF_EDIT_SITE':
      if (Alfresco && Alfresco.module && typeof Alfresco.module.getEditSiteInstance === 'function') {
        Alfresco.module.getEditSiteInstance().show({
          shortName: payload.site
        });
      } else {
        const legacyEditSiteResource =
          Alfresco.constants.URL_RESCONTEXT + 'modules/edit-site' + (Alfresco.constants.DEBUG ? '.js' : '-min.js');
        require([legacyEditSiteResource], function() {
          Alfresco.module.getEditSiteInstance().show({
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
              label: t('button.leave-site.confirm-label'),
              onClick: () => {
                dispatch(leaveSiteRequest(payload));
                dispatch(hideModal());
              },
              color: 'primary'
            },
            {
              label: t('button.leave-site.cancel-label'),
              isCloseButton: true
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
      Citeck.forms.handleHeaderCreateVariant(payload);
      break;

    default:
      try {
        return newHandleControl(type, payload, dispatch);
      } catch (e) {
        console.warn('Unknown control type: ', type);
      }
  }
}
