import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import { getData, getSessionData, setData, setSessionData, transferData } from '../helpers/ls';
import { getCurrentUserName } from '../helpers/util';

const prefixDashlet = 'ecos-ui-dashlet-settings_id-';
const prefixJournal = 'ecos-ui-journal-settings_id-';
const prefixMenu = 'menuSettings_';
const prefixUser = '/user-';

function getDashletSettings(key) {
  let dashletData = getData(key);

  if (isEmpty(dashletData)) {
    dashletData = {};
  }

  return dashletData;
}

function getKey(key) {
  return `${key}${prefixUser}${getCurrentUserName()}`;
}

export default class UserLocalSettingsService {
  static getMenuKey() {
    return `${prefixMenu}${getCurrentUserName()}`;
  }

  static getDashletKey(key) {
    return `${prefixDashlet}${getKey(key)}`;
  }

  static getJournalKey(key) {
    return `${prefixJournal}${getKey(key || 'all')}`;
  }

  static checkOldData(dashletId) {
    self.transferData(`${prefixDashlet}${dashletId}`, self.getDashletKey(dashletId));
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

  static setProperty(dashletId, property = {}) {
    const key = UserLocalSettingsService.getKey(dashletId);
    const data = getDashletSettings(key);

    setData(key, { ...data, ...property });
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

    setData(key, dashletData);
  }

  static getDashletScale(dashletId) {
    const key = self.getDashletKey(dashletId);

    return get(getDashletSettings(key), DashletProps.CONTENT_SCALE);
  }

  static setDashletScale(dashletId, scale) {
    const key = self.getDashletKey(dashletId);
    const dashletData = getDashletSettings(key);

    dashletData.contentScale = scale;

    setData(key, dashletData);
  }
}
const self = UserLocalSettingsService;

export const DashletProps = {
  IS_COLLAPSED: 'isCollapsed',
  CONTENT_HEIGHT: 'contentHeight',
  CONTENT_SCALE: 'contentScale'
};

export const JournalProps = {};
