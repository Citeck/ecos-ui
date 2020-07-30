import { URL_RESCONTEXT, URL_SERVICECONTEXT, URL_EIS_CONFIG, PROXY_URI, URL_PAGECONTEXT } from '../constants/alfresco';
import { getCurrentUserName, loadScript, t } from '../helpers/util';
import { goToCardDetailsPage } from '../helpers/urls';
import FormManager from '../components/EcosForm/FormManager';
import dialogManager from '../components/common/dialogs/Manager';
import { requireShareAssets } from '../legacy/share';
import ecosFetch from './ecosFetch';

export const HandleControlTypes = {
  ALF_DOLOGOUT: 'ALF_DOLOGOUT',
  ALF_SHOW_MODAL_MAKE_UNAVAILABLE: 'ALF_SHOW_MODAL_MAKE_UNAVAILABLE',
  ALF_NAVIGATE_TO_PAGE: 'ALF_NAVIGATE_TO_PAGE',
  ALF_CREATE_SITE: 'ALF_CREATE_SITE',
  ALF_EDIT_SITE: 'ALF_EDIT_SITE',
  ALF_LEAVE_SITE: 'ALF_LEAVE_SITE',
  ALF_JOIN_SITE: 'ALF_JOIN_SITE',
  ALF_BECOME_SITE_MANAGER: 'ALF_BECOME_SITE_MANAGER',
  ALF_REQUEST_SITE_MEMBERSHIP: 'ALF_REQUEST_SITE_MEMBERSHIP',
  ECOS_CREATE_VARIANT: 'ECOS_CREATE_VARIANT'
};

const HCT = HandleControlTypes;

const LOGOUT_URL_DEFAULT = `${URL_SERVICECONTEXT}dologout`;

export default function handleControl(type, payload) {
  switch (type) {
    case HCT.ALF_DOLOGOUT:
      const logoutHandler = (logoutURL = LOGOUT_URL_DEFAULT) => {
        ecosFetch(logoutURL, { method: 'POST', mode: 'no-cors' }).then(() => {
          window.location.reload();
        });
      };
      ecosFetch(URL_EIS_CONFIG)
        .then(r => r.json())
        .then(config => {
          const EIS_LOGOUT_URL_DEFAULT_VALUE = 'LOGOUT_URL';
          const { logoutUrl = EIS_LOGOUT_URL_DEFAULT_VALUE } = config || {};
          if (logoutUrl !== EIS_LOGOUT_URL_DEFAULT_VALUE) {
            return logoutHandler(logoutUrl);
          }
          return logoutHandler();
        })
        .catch(() => logoutHandler());
      break;

    case HCT.ALF_SHOW_MODAL_MAKE_UNAVAILABLE:
      return (() => {
        const openDialog = () => {
          window.Citeck.forms.dialog('deputy:selfAbsenceEvent', '', {
            fn: function() {
              handleControl(HCT.ALF_NAVIGATE_TO_PAGE, {
                url: payload.targetUrl
              });
            }
          });
        };

        const isCiteckFormDialogReady = () => {
          return window.Citeck && window.Citeck.forms && window.Citeck.forms.dialog && typeof window.Citeck.forms.dialog === 'function';
        };

        if (isCiteckFormDialogReady()) {
          return openDialog();
        }

        return requireShareAssets().then(() => {
          const intervalId = setInterval(() => {
            if (!isCiteckFormDialogReady()) {
              return;
            }

            clearInterval(intervalId);
            openDialog();
          }, 300);
        });
      })();

    case HCT.ALF_NAVIGATE_TO_PAGE:
      // TODO improve it
      // if (payload.targetUrlType === 'FULL_PATH')
      if (payload.target && payload.target === '_blank') {
        window.open(payload.url, '_blank');
      } else {
        window.location.href = payload.url;
      }
      break;

    case HCT.ALF_CREATE_SITE:
      if (window.Alfresco && window.Alfresco.module && typeof window.Alfresco.module.getCreateSiteInstance === 'function') {
        window.Alfresco.module.getCreateSiteInstance().show();
      } else {
        const createSiteScript = `${URL_RESCONTEXT}modules/create-site${process.env.NODE_ENV === 'development' ? '.js' : '-min.js'}`;
        requireShareAssets().then(() => {
          loadScript(createSiteScript, function() {
            window.Alfresco.module.getCreateSiteInstance().show();
          });
        });
      }

      break;

    case HCT.ALF_EDIT_SITE:
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

    case HCT.ALF_LEAVE_SITE:
      return (() => {
        const { site, siteTitle, user, userFullName } = payload;
        dialogManager.confirmDialog({
          title: t('message.leave', { name: siteTitle }),
          text: t('message.leave-site-prompt', { name: siteTitle }),
          onNo: () => {},
          onYes: () => {
            const url = `${PROXY_URI}api/sites/${encodeURIComponent(site)}/memberships/${encodeURIComponent(user)}`;
            return ecosFetch(url, { method: 'DELETE' })
              .then(resp => {
                if (resp.status !== 200) {
                  return dialogManager.showInfoDialog({
                    title: t('error'),
                    text: t('message.leave-failure', { userFullName, siteTitle })
                  });
                }

                dialogManager.showInfoDialog({
                  text: t('message.leaving', { userFullName, siteTitle })
                });

                window.location.href = URL_PAGECONTEXT + 'user/' + encodeURIComponent(user) + '/dashboard';
              })
              .catch(err => {
                console.log('error', err);
              });
          }
        });
      })();

    case HCT.ALF_JOIN_SITE:
      return (() => {
        const { site, user } = payload;
        const url = `${PROXY_URI}api/sites/${encodeURIComponent(site)}/memberships`;
        const data = {
          role: 'SiteConsumer',
          person: {
            userName: user
          }
        };

        ecosFetch(url, { method: 'PUT', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: data })
          .then(resp => {
            if (resp.status !== 200) {
              console.log('joinSiteRequest err', resp);
              return;
            }

            dialogManager.showInfoDialog({
              text: t('message.joining', { user, site })
            });

            window.location.reload();
          })
          .catch(err => {
            console.log('error', err);
          });
      })();

    case HCT.ALF_BECOME_SITE_MANAGER:
      return (() => {
        const { site, user } = payload;
        const url = `${PROXY_URI}api/sites/${encodeURIComponent(site)}/memberships`;
        const data = {
          role: 'SiteManager',
          person: {
            userName: user ? user : getCurrentUserName()
          }
        };

        return ecosFetch(url, { method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: data })
          .then(resp => {
            if (resp.status !== 200) {
              console.log('becomeSiteManagerRequest err', resp);
              return;
            }

            window.location.reload();
          })
          .catch(err => {
            console.log('error', err);
          });
      })();

    case HCT.ALF_REQUEST_SITE_MEMBERSHIP:
      return (() => {
        const { site, siteTitle, user } = payload;
        const url = `${PROXY_URI}api/sites/${encodeURIComponent(site)}/invitations`;
        const data = {
          invitationType: 'MODERATED',
          inviteeRoleName: 'SiteConsumer',
          inviteeUserName: user,
          inviteeComments: ''
        };

        return ecosFetch(url, {
          method: 'POST',
          headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
          body: data
        })
          .then(resp => {
            if (resp.status !== 200) {
              const responseMessage = resp.message;
              const requestPendingMessage = 'A request to join this site is in pending'; // NOTE: This is a string-literal in Share's "Site.java" file
              const failedBecausePending = responseMessage && responseMessage.indexOf(requestPendingMessage) !== -1;
              const failureMessage = failedBecausePending
                ? 'message.request-join-site-pending-failure'
                : 'message.request-join-site-failure';

              return dialogManager.showInfoDialog({
                title: t('error'),
                text: t(failureMessage)
              });
            }

            return dialogManager.showInfoDialog({
              title: t('message.request-join-success-title'),
              text: t('message.request-join-success', { site: siteTitle || site }),
              onClose: () => {
                window.location.href = URL_PAGECONTEXT + 'user/' + encodeURIComponent(user) + '/dashboard';
              }
            });
          })
          .catch(err => {
            console.log('error', err);
          });
      })();

    case HCT.ECOS_CREATE_VARIANT:
      FormManager.createRecordByVariant(payload, {
        onSubmit: record => {
          if (payload.afterSubmit === 'reload') {
            window.location.reload();
          } else if (payload.afterSubmit === 'none') {
            //none
          } else {
            goToCardDetailsPage(record.id);
          }
        }
      });
      break;

    default:
      console.warn('Unknown control type: ', type);
  }
}
