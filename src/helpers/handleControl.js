import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';

import { SourcesId, URL } from '../constants';
import { PROXY_URI, URL_EIS_CONFIG } from '../constants/alfresco';
import DialogManager from '../components/common/dialogs/Manager';
import Records from '../components/Records/Records';
import { ActionTypes } from '../components/Records/actions';
import RecordActions from '../components/Records/actions/recordActions';
import { CommonApi } from '../api/common';
import PageService from '../services/PageService';
import { NEW_VERSION_PREFIX } from './export/urls';
import { extractLabel, getCurrentUserName, t } from './util';
import formDefinitionUserStatus from './menu/formDefinitionUserStatus';
import ecosFetch from './ecosFetch';

export const HandleControlTypes = {
  ALF_DOLOGOUT: 'ALF_DOLOGOUT',
  ALF_NAVIGATE_TO_PAGE: 'ALF_NAVIGATE_TO_PAGE',
  ALF_EDIT_SITE: 'ALF_EDIT_SITE',
  ALF_LEAVE_SITE: 'ALF_LEAVE_SITE',
  ALF_JOIN_SITE: 'ALF_JOIN_SITE',
  ALF_BECOME_SITE_MANAGER: 'ALF_BECOME_SITE_MANAGER',
  ALF_REQUEST_SITE_MEMBERSHIP: 'ALF_REQUEST_SITE_MEMBERSHIP',
  ECOS_EDIT_PASSWORD: 'ECOS_EDIT_PASSWORD',
  ECOS_EDIT_AVAILABILITY: 'ECOS_EDIT_AVAILABILITY',
  ECOS_CREATE_VARIANT: 'ECOS_CREATE_VARIANT',
  ECOS_OPEN_FORM: 'ECOS_OPEN_FORM'
};

const HCT = HandleControlTypes;

const LOGOUT_URL_DEFAULT = '/logout';

export const toggleAvailabilityStatus = payload => {
  const commonApi = new CommonApi();
  const fetch = () => {
    return commonApi
      .postJson(`${PROXY_URI}api/availability/make-available`, {
        isAvailable: !payload.isAvailable
      })
      .then(() => {
        window.location.reload();
      })
      .catch(() => '');
  };

  if (!payload.isAvailable) {
    fetch();

    return;
  }

  DialogManager.showFormDialog({
    title: t('header.make-notavailable.label'),
    showDefaultButtons: true,
    modalClass: 'ecos-modal_width-sm',
    reactstrapProps: {
      backdrop: true
    },
    formDefinition: formDefinitionUserStatus,
    onSubmit: async submission => {
      const userRef = await Records.get(`${SourcesId.PEOPLE}@${getCurrentUserName()}`).load('nodeRef?str');
      const result = await ecosFetch(`${PROXY_URI}citeck/ecos/forms/node-view?formType=type&formKey=deputy:selfAbsenceEvent`, {
        method: 'POST',
        body: {
          attributes: {
            'deputy:endAbsence': get(submission, 'data.absenceBeginning', ''),
            'deputy:startAbsence': get(submission, 'data.absenceEnd', ''),
            'deputy:autoAnswer': get(submission, 'data.autoAnswer', ''),
            'deputy:user': userRef
          }
        }
      })
        .then(response => response.json())
        .catch(e => {
          console.error(e);
        });

      if (!isEmpty(result)) {
        await fetch();
      }
    }
  });
};

/**
 * @description dispatch action by type
 * @deprecated
 * @todo it have to be rethought and does via redux, after old functionalities are implemented, according parts (ex. slideMenu)
 * @param type action
 * @param payload data
 * @returns {Promise<Response>|void}
 */
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
          let { logoutUrl = EIS_LOGOUT_URL_DEFAULT_VALUE } = config || {};

          if (logoutUrl === EIS_LOGOUT_URL_DEFAULT_VALUE) {
            logoutUrl = LOGOUT_URL_DEFAULT;
          }

          return logoutHandler(logoutUrl);
        })
        .catch(() => logoutHandler());
      break;

    case HCT.ECOS_EDIT_AVAILABILITY:
      return toggleAvailabilityStatus(payload);

    case HCT.ALF_NAVIGATE_TO_PAGE:
      if (payload.url.indexOf(NEW_VERSION_PREFIX) !== -1) {
        PageService.changeUrlLink(payload.url, { openNewTab: true });
        return;
      }

      // TODO improve it
      // if (payload.targetUrlType === 'FULL_PATH')
      if (payload.target && payload.target === '_blank') {
        window.open(payload.url, '_blank');
      } else {
        window.location.href = payload.url;
      }
      break;

    case HCT.ALF_EDIT_SITE:
      if (window.Alfresco && window.Alfresco.module && typeof window.Alfresco.module.getEditSiteInstance === 'function') {
        window.Alfresco.module.getEditSiteInstance().show({
          shortName: payload.site
        });
      }

      break;

    case HCT.ALF_LEAVE_SITE:
      return (() => {
        const { site, siteTitle, user, userFullName } = payload;
        DialogManager.confirmDialog({
          title: t('message.leave', { name: siteTitle }),
          text: t('message.leave-site-prompt', { name: siteTitle }),
          onNo: _ => _,
          onYes: () => {
            const url = `${PROXY_URI}api/sites/${encodeURIComponent(site)}/memberships/${encodeURIComponent(user)}`;
            return ecosFetch(url, { method: 'DELETE' })
              .then(resp => {
                if (resp.status !== 200) {
                  return DialogManager.showInfoDialog({
                    title: t('error'),
                    text: t('message.leave-failure', { userFullName, siteTitle })
                  });
                }

                DialogManager.showInfoDialog({
                  text: t('message.leaving', { userFullName, siteTitle })
                });

                window.location.href = URL.DASHBOARD;
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

            DialogManager.showInfoDialog({
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

              return DialogManager.showInfoDialog({
                title: t('error'),
                text: t(failureMessage)
              });
            }

            return DialogManager.showInfoDialog({
              title: t('message.request-join-success-title'),
              text: t('message.request-join-success', { site: siteTitle || site }),
              onClose: () => {
                window.location.href = URL.DASHBOARD;
              }
            });
          })
          .catch(err => {
            console.log('error', err);
          });
      })();

    case HCT.ECOS_EDIT_PASSWORD:
      RecordActions.execForRecord(`${SourcesId.PEOPLE}@${getCurrentUserName()}`, { type: ActionTypes.EDIT_PASSWORD }).catch(console.error);
      break;
    case HCT.ECOS_OPEN_FORM:
      EcosFormUtils.eform(payload.recordRef, {
        params: { formId: payload.formRef, options: payload.formOptions },
        title: extractLabel(payload.formTitle),
        class: 'ecos-modal_width-lg',
        isBigHeader: true
      });
      break;
    default:
      console.warn('Unknown control type: ', type);
  }
}
