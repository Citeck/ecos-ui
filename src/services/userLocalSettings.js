import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import { getData, setData, transferData } from '../helpers/ls';
import { getCurrentUserName } from '../helpers/util';

const prefix = 'ecos-ui-dashlet-settings_id-';
const prefixMenu = 'menuSettings_';
const newVersionPath = '/user-';

function getDashletSettings(key) {
  let dashletData = getData(key);

  if (isEmpty(dashletData)) {
    dashletData = {};
  }

  return dashletData;
}

function setDashletSettings(key, data) {
  setData(key, data);
}

export default class UserLocalSettingsService {
  static getPrefix = () => prefix;

  static getNewVersionPath = () => newVersionPath;

  static getOldKey = dashletId => `${UserLocalSettingsService.getPrefix()}${dashletId}`;

  static getKey(dashletId) {
    const userName = getCurrentUserName();

    return `${UserLocalSettingsService.getPrefix()}${dashletId}${UserLocalSettingsService.getNewVersionPath()}${userName}`;
  }

  static checkOldData(dashletId) {
    UserLocalSettingsService.transferData(UserLocalSettingsService.getOldKey(dashletId), UserLocalSettingsService.getKey(dashletId));
  }

  static transferData(oldKey, newKey) {
    transferData(oldKey, newKey, true);
  }

  /*common settings*/

  static setMenuMode(data) {
    const userName = getCurrentUserName();

    setData(`${prefixMenu}${userName}`, { ...UserLocalSettingsService.getMenuMode(), ...data });
  }

  static getMenuMode() {
    const userName = getCurrentUserName();

    return getData(`${prefixMenu}${userName}`);
  }

  /*dashlets settings*/

  static setProperty(dashletId, property = {}) {
    const key = UserLocalSettingsService.getKey(dashletId);
    const data = getDashletSettings(key);

    setDashletSettings(key, { ...data, ...property });
  }

  static getProperty(dashletId, propertyName) {
    const key = UserLocalSettingsService.getKey(dashletId);
    const data = getDashletSettings(key);

    return get(data, [propertyName]);
  }

  static getDashletHeight(dashletId) {
    const key = UserLocalSettingsService.getKey(dashletId);

    return get(getDashletSettings(key), 'contentHeight');
  }

  static setDashletHeight(dashletId, height) {
    const key = UserLocalSettingsService.getKey(dashletId);
    const dashletData = getDashletSettings(key);

    dashletData.contentHeight = height;

    setDashletSettings(key, dashletData);
  }

  static getDashletScale(dashletId) {
    const key = UserLocalSettingsService.getKey(dashletId);

    return get(getDashletSettings(key), 'contentScale');
  }

  static setDashletScale(dashletId, scale) {
    const key = UserLocalSettingsService.getKey(dashletId);
    const dashletData = getDashletSettings(key);

    dashletData.contentScale = scale;

    setDashletSettings(key, dashletData);
  }
}
