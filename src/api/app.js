import * as queryString from 'query-string';
import { NotificationManager } from '@/services/notifications';
import get from 'lodash/get';
import isNil from 'lodash/isNil';

import ecosXhr from '../helpers/ecosXhr';
import ecosFetch, { RESET_AUTH_STATE_EVENT, emitter } from '../helpers/ecosFetch';
import { t } from '../helpers/export/util';
import { AppEditions, DEFAULT_EIS, SourcesId } from '../constants';
import { PROXY_URI, UISERV_API } from '../constants/alfresco';
import Records from '../components/Records/Records';
import { ALL_USERS_GROUP_SHORT_NAME } from '../components/common/form/SelectOrgstruct/constants';
import { CommonApi } from './common';
import { allowedLanguages, LANGUAGE_EN } from '../constants/lang';
import ConfigService, {
  RESTRICT_ACCESS_TO_EDIT_DASHBOARD,
  RESTRICT_ACCESS_TO_EDIT_DASHBOARD_WIDGETS,
  ORGSTRUCT_ALL_USERS_GROUP_SHORT_NAME,
  FOOTER_CONTENT,
  CUSTOM_REPORT_ISSUE_URL,
  CUSTOM_FEEDBACK_URL,
  SEPARATE_ACTION_LIST_FOR_QUERY,
  LOGIN_PAGE_REDIRECT_URL,
  TOUCH_CONFIG
} from '../services/config/ConfigService';

let customLogoutAction = null;

export class AppApi extends CommonApi {
  #isAuthenticated = true;

  constructor() {
    super();

    emitter.on(RESET_AUTH_STATE_EVENT, () => {
      this.#isAuthenticated = false;
    });
  }

  setCustomLogoutAction(action) {
    customLogoutAction = action;
  }

  touch = () => {
    if (!this.#isAuthenticated || document.hidden) {
      return Promise.resolve();
    }
    return ConfigService.getValue(TOUCH_CONFIG).then(config => {
      if (!config.enabled || !config.uri) {
        return Promise.resolve('OK');
      }
      return ecosFetch(config.uri).then(r => r.text());
    });
  };

  getOrgstructAllUsersGroupName = () => {
    return ConfigService.getValue(ORGSTRUCT_ALL_USERS_GROUP_SHORT_NAME).then(resp => resp || ALL_USERS_GROUP_SHORT_NAME);
  };

  // upload file without alfresco
  uploadFileV2 = (data, callback) => {
    return ecosXhr('/gateway/emodel/api/ecos/webapp/content', {
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
      ConfigService.getValue(RESTRICT_ACCESS_TO_EDIT_DASHBOARD),
      Records.get(`${SourcesId.PERSON}@${username}`)
        .load('isAdmin?bool')
        .catch(() => false)
    ]).then(([isRestrictionOn, isAdmin]) => !isRestrictionOn || isAdmin);
  };

  isWidgetEditable = ({ username }) => {
    return Promise.all([
      ConfigService.getValue(RESTRICT_ACCESS_TO_EDIT_DASHBOARD),
      ConfigService.getValue(RESTRICT_ACCESS_TO_EDIT_DASHBOARD_WIDGETS),
      Records.get(`${SourcesId.PERSON}@${username}`)
        .load('isAdmin?bool')
        .catch(() => false)
    ]).then(([isDashboardRestrictionOn, isWidgetRestrictionOn, isAdmin]) => {
      if (isAdmin) {
        return true;
      }

      if (isWidgetRestrictionOn === '' || isNil(isWidgetRestrictionOn)) {
        return !isDashboardRestrictionOn;
      }

      return isWidgetRestrictionOn !== 'true';
    });
  };

  getBase64 = file => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    }).catch(err => {
      console.error(err);
      return {};
    });
  };

  getFooter = () => {
    return ConfigService.getValue(FOOTER_CONTENT);
  };

  static async getDictionaryLocal(lang) {
    let isExist;

    try {
      await import(/* @vite-ignore */ `../i18n/${lang}`);
      isExist = true;
    } catch (e) {
      isExist = false;
    }

    if (!isExist) {
      lang = get(allowedLanguages, '0.id', LANGUAGE_EN);
    }

    return import(/* @vite-ignore */ `../i18n/${lang}`)
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
    const url = queryString.stringifyUrl({ url: `${UISERV_API}messages/locale`, query: { id, cb } });

    return ecosFetch(url)
      .then(res => (res.ok ? res.json() : Promise.reject(res)))
      .catch(e => {
        console.error(e);
        return {};
      });
  }

  isForceOldUserDashboardEnabled() {
    return false;
  }

  recordIsExist(recordRef, showNotification = false) {
    return Records.get(recordRef)
      .load('_notExists?bool', true)
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

  getLoginPageUrl = () => {
    return ConfigService.getValue(LOGIN_PAGE_REDIRECT_URL);
  };

  getAppEdition = () => {
    return Records.get(`${SourcesId.MODEL_META}@`)
      .load('$license.enterprise?bool')
      .then(result => (result ? AppEditions.ENTERPRISE : AppEditions.COMMUNITY))
      .catch(() => AppEditions.COMMUNITY);
  };

  getIsExternalIDP = () => {
    return ecosFetch('/eis.json')
      .then(r => r.json())
      .then(config => {
        const { logoutUrl } = config || {};
        return !logoutUrl || logoutUrl === DEFAULT_EIS.LOGOUT_URL;
      })
      .catch(() => false);
  };

  getSeparateActionListForQuery() {
    return ConfigService.getValue(SEPARATE_ACTION_LIST_FOR_QUERY);
  }

  static doLogOut = async () => {
    const DEF_LOGOUT = `/logout`;

    if (customLogoutAction != null) {
      customLogoutAction();
      return;
    }

    const url = await ecosFetch('/eis.json')
      .then(r => r.json())
      .then(config => {
        const { logoutUrl, eisId } = config || {};
        const isLogoutUrl = logoutUrl && logoutUrl !== DEFAULT_EIS.LOGOUT_URL;
        const isNoEisId = !eisId || eisId === DEFAULT_EIS.EIS_ID;

        return isLogoutUrl ? logoutUrl : isNoEisId ? DEF_LOGOUT : undefined;
      })
      .catch(() => DEF_LOGOUT);

    if (url) {
      await ecosFetch(url, { method: 'POST', mode: 'no-cors' });
      window.location.reload();
    } else {
      NotificationManager.warning(t('page.error.logout.no-url'));
    }
  };

  static doToggleAvailable = (isAvailable, awayAuthDelegationEnabled = null) => {
    const person = Records.getRecordToEdit(SourcesId.CURRENT_USER);
    person.att('atWorkplace', !isAvailable);
    if (awayAuthDelegationEnabled != null) {
      person.att('awayAuthDelegationEnabled', awayAuthDelegationEnabled);
    }
    return person
      .save()
      .then(() => {
        window.location.reload();
        return '';
      })
      .catch(e => {
        console.error('Error while availability changing', e);
      });
  };

  static getCustomFeedbackUrl = () => {
    return ConfigService.getValue(CUSTOM_FEEDBACK_URL);
  };

  static getCustomReportIssueUrl = () => {
    return ConfigService.getValue(CUSTOM_REPORT_ISSUE_URL);
  };
}
