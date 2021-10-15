import * as queryString from 'query-string';
import { NotificationManager } from 'react-notifications';

import ecosXhr from '../helpers/ecosXhr';
import ecosFetch from '../helpers/ecosFetch';
import { isExistValue } from '../helpers/util';
import { t } from '../helpers/export/util';
import { DEFAULT_EIS, SourcesId, URL } from '../constants';
import { CITECK_URI, MICRO_URI, PROXY_URI, URL_SERVICECONTEXT } from '../constants/alfresco';
import Records from '../components/Records/Records';
import { ALL_USERS_GROUP_SHORT_NAME } from '../components/common/form/SelectOrgstruct/constants';
import { CommonApi } from './common';

export class AppApi extends CommonApi {
  getEcosConfig = configName => {
    const url = `${CITECK_URI}ecosConfig/ecos-config-value?configName=${configName}`;
    return this.getJson(url)
      .then(resp => resp.value)
      .catch(() => '');
  };

  touch = () => {
    const url = `${CITECK_URI}ecos/touch`;
    return this.getJson(url);
  };

  getOrgstructAllUsersGroupName = () => {
    return Records.get(`${SourcesId.CONFIG}@orgstruct-allUsers-group-shortName`)
      .load('value')
      .then(resp => resp || ALL_USERS_GROUP_SHORT_NAME)
      .catch(() => ALL_USERS_GROUP_SHORT_NAME);
  };

  uploadFile = (data, callback) => {
    return ecosXhr(`${PROXY_URI}eform/file`, {
      method: 'POST',
      body: data,
      handleProgress: callback
    }).then(
      response => response,
      error => {
        throw error;
      }
    );
  };

  isDashboardEditable = ({ username }) => {
    return Promise.all([
      Records.get(`${SourcesId.CONFIG}@restrict-access-to-edit-dashboard`)
        .load('value?bool')
        .then(value => (isExistValue(value) ? value : true))
        .catch(() => true),
      Records.get(`${SourcesId.PEOPLE}@${username}`)
        .load('isAdmin?bool')
        .catch(() => false)
    ]).then(([isRestrictionOn, isAdmin]) => !isRestrictionOn || isAdmin);
  };

  getBase64 = file => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    })
      .then(result => result)
      .catch(err => {
        console.error(err);
        return {};
      });
  };

  getFooter = (params = 'value?str') => {
    return Records.get(`${SourcesId.CONFIG}@footer-content`)
      .load(params)
      .catch(() => null);
  };

  static getDictionaryLocal(lang) {
    return import(`../i18n/${lang}`)
      .then(module => module.default)
      .catch(e => {
        console.error(e);
        return {};
      });
  }

  /**
   * Fetch translation dictionary for selected lang
   * @param id - selected lang [ en | ru | ... ]
   * @returns {Promise<Object<String,String>>}
   */
  static async getDictionaryServer(id) {
    const cb = await Records.get(`${SourcesId.META}@`)
      .load('attributes.i18n-cache-key')
      .then(k => k || '0')
      .catch(_ => '0');
    const url = queryString.stringifyUrl({ url: `${MICRO_URI}api/messages/locale`, query: { id, cb } });

    return ecosFetch(url)
      .then(res => (res.ok ? res.json() : Promise.reject(res)))
      .catch(e => {
        console.error(e);
        return {};
      });
  }

  isForceOldUserDashboardEnabled() {
    return Records.get(`${SourcesId.ECOS_CONFIG}@force-old-user-dashboard-enabled`)
      .load('.bool')
      .then(res => res === true)
      .catch(() => false);
  }

  recordIsExist(recordRef, showNotification = false) {
    return Records.get(recordRef)
      .load('_notExists?bool')
      .then(status => {
        if (status === null) {
          return true;
        }

        return !status;
      })
      .catch(e => {
        if (showNotification) {
          NotificationManager.error(t('page.error-loading.message'), t('page.error-loading.title'));
        }

        console.error(e);
        return false;
      });
  }

  hasRecordReadPermission(recordRef, showNotification = false) {
    return Records.get(recordRef)
      .load('.att(n:"permissions"){has(n:"Read")}')
      .then(status => {
        if (status === null) {
          return true;
        }

        return status;
      })
      .catch(e => {
        if (showNotification) {
          NotificationManager.error(t('page.error-loading.message'), t('page.error-loading.title'));
        }

        console.error(e);
        return false;
      });
  }

  getHomeLink() {
    return Records.get(`${SourcesId.CONFIG}@home-link-url`)
      .load('value?str')
      .then(link => {
        if (!link) {
          return URL.DASHBOARD;
        }
        return link;
      })
      .catch(() => URL.DASHBOARD);
  }

  getLoginPageUrl = () => {
    return Records.get(`${SourcesId.CONFIG}@login-page-redirect-url`)
      .load('value?str', true)
      .catch(() => null);
  };

  getAppEdition = () => {
    return Records.get(`${SourcesId.A_META}@`).load('attributes.edition');
  };

  getIsExternalIDP = () => {
    return ecosFetch('/eis.json')
      .then(r => r.json())
      .then(config => {
        const { logoutUrl, eisId } = config || {};
        const isNoLogoutUrl = !logoutUrl || logoutUrl === DEFAULT_EIS.LOGOUT_URL;
        const isEisId = eisId && eisId !== DEFAULT_EIS.EIS_ID;

        return isNoLogoutUrl && isEisId;
      })
      .catch(() => false);
  };

  getSeparateActionListForQuery() {
    return Records.get(`${SourcesId.CONFIG}@separate-action-list-for-query`)
      .load('value?bool!false')
      .catch(() => false);
  }

  static doLogOut = async () => {
    const shareDoLogout = `${URL_SERVICECONTEXT}dologout`;

    const url = await ecosFetch('/eis.json')
      .then(r => r.json())
      .then(config => {
        const { logoutUrl, eisId } = config || {};
        const isLogoutUrl = logoutUrl && logoutUrl !== DEFAULT_EIS.LOGOUT_URL;
        const isNoEisId = !eisId || eisId === DEFAULT_EIS.EIS_ID;

        return isLogoutUrl ? logoutUrl : isNoEisId ? shareDoLogout : undefined;
      })
      .catch(() => shareDoLogout);

    if (url) {
      await ecosFetch(url, { method: 'POST', mode: 'no-cors' });
      window.location.reload();
    } else {
      NotificationManager.warning(t('page.error.logout.no-url'));
    }
  };
}
