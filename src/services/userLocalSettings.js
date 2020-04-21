import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import moment from 'moment';

import { getData, getSessionData, setData, setSessionData, transferData, removeItem } from '../helpers/ls';
import { getCurrentUserName } from '../helpers/util';

export const Prefixes = {
  DASHLET: 'ecos-ui-dashlet-settings_id-',
  JOURNAL: 'ecos-ui-journal-settings_id-',
  MENU: 'menuSettings_',
  USER: '/user-'
};

/**
 * maximum data storage time in lS
 *
 * @type {{COUNT: number, TYPE: string momentjs month key}}
 */
export const DateStorageTime = {
  TYPE: 'M',
  COUNT: 6
};

function getDashletSettings(key) {
  let dashletData = getData(key);

  if (isEmpty(dashletData)) {
    dashletData = {};
  }

  return dashletData;
}

function getKey(key) {
  return `${key}${Prefixes.USER}${getCurrentUserName()}`;
}

export default class UserLocalSettingsService {
  static getMenuKey() {
    return `${Prefixes.MENU}${getCurrentUserName()}`;
  }

  static getDashletKey(key) {
    return `${Prefixes.DASHLET}${getKey(key)}`;
  }

  static getJournalKey(key) {
    return `${Prefixes.JOURNAL}${getKey(key || 'all')}`;
  }

  static checkOldData(dashletId) {
    self.transferData(`${Prefixes.DASHLET}${dashletId}`, self.getDashletKey(dashletId));
  }

  static transferData(oldKey, newKey) {
    transferData(oldKey, newKey, true);
  }

  /*common settings*/

  static setMenuMode(data) {
    setData(self.getMenuKey(), { ...self.getMenuMode(), ...data });
  }

  static getMenuMode() {
    return getData(self.getMenuKey());
  }

  /*journals settings*/

  static setJournalProperty(key, property = {}, isTemp) {
    const journal = self.getJournalKey(key);
    const data = isTemp ? getSessionData(journal) || {} : getData(journal) || {};
    const upData = { ...data, ...property };

    if (isTemp) {
      setSessionData(journal, upData);
    } else {
      setData(journal, upData);
    }
  }

  static getJournalAllProps(key, isTemp) {
    const journal = self.getJournalKey(key);

    return isTemp ? getSessionData(journal) || {} : getData(journal) || {};
  }

  static getJournalProperty(key, propertyName, isTemp) {
    const data = self.getJournalAllProps(key, isTemp);

    return get(data, [propertyName]);
  }

  /*dashlets settings*/
  static setDashletProperty(dashletId, property = {}) {
    const key = UserLocalSettingsService.getDashletKey(dashletId);
    const data = getDashletSettings(key);

    setData(key, {
      ...data,
      ...property,
      lastUsedDate: Date.now()
    });
  }

  static getDashletProperty(dashletId, propertyName) {
    const key = self.getDashletKey(dashletId);
    const data = getDashletSettings(key);

    return get(data, [propertyName]);
  }

  static getDashletHeight(dashletId) {
    const key = self.getDashletKey(dashletId);

    return get(getDashletSettings(key), DashletProps.CONTENT_HEIGHT);
  }

  static setDashletHeight(dashletId, height = null) {
    const key = self.getDashletKey(dashletId);
    const dashletData = getDashletSettings(key);

    if (height === null) {
      delete dashletData.contentHeight;
    } else {
      dashletData.contentHeight = height;
    }

    self.setDashletProperty(dashletId, dashletData);
  }

  static getDashletScale(dashletId) {
    const key = self.getDashletKey(dashletId);

    return get(getDashletSettings(key), DashletProps.CONTENT_SCALE);
  }

  static setDashletScale(dashletId, contentScale) {
    self.setDashletProperty(dashletId, { contentScale });
  }

  static updateDashletDate(dashletId) {
    const key = self.getDashletKey(dashletId);
    const dashletData = getDashletSettings(key);

    if (isEmpty(dashletData)) {
      return;
    }

    self.setDashletProperty(dashletId, {
      ...dashletData,
      lastUsedDate: Date.now()
    });
  }

  static checkDasletsUpdatedDate() {
    const keys = Object.keys(window.localStorage).filter(key => key.includes(Prefixes.DASHLET));

    keys.forEach(key => {
      const dashletData = getDashletSettings(key);
      const lastUsedDate = get(dashletData, 'lastUsedDate', null);

      if (!lastUsedDate) {
        return;
      }

      if (moment().diff(moment(lastUsedDate), DateStorageTime.TYPE) >= DateStorageTime.COUNT) {
        removeItem(key);
      }
    });
  }
}
const self = UserLocalSettingsService;

export const DashletProps = {
  IS_COLLAPSED: 'isCollapsed',
  CONTENT_HEIGHT: 'contentHeight',
  CONTENT_SCALE: 'contentScale'
};

export const JournalProps = {};
