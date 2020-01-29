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

class UserLocalSettingsService {
  static getMenuKey() {
    return `${prefixMenu}${getCurrentUserName()}`;
  }

  static getDashletKey(key) {
    return `${prefixDashlet}${getKey(key)}`;
  }

  static checkOldData(dashletId) {
    selfService.transferData(`${prefixDashlet}${dashletId}`, selfService.getDashletKey(dashletId));
  }

  static transferData(oldKey, newKey) {
    transferData(oldKey, newKey, true);
  }

  /*common settings*/

  static setMenuMode(data) {
    setData(selfService.getMenuKey(), { ...selfService.getMenuMode(), ...data });
  }

  static getMenuMode() {
    return getData(selfService.getMenuKey());
  }

  /*dashlets settings*/

  static setProperty(dashletId, property = {}) {
    const key = UserLocalSettingsService.getKey(dashletId);
    const data = getDashletSettings(key);

    setData(key, { ...data, ...property });
  }

  static getDashletProperty(dashletId, propertyName) {
    const key = selfService.getDashletKey(dashletId);
    const data = getDashletSettings(key);

    return get(data, [propertyName]);
  }

  static getDashletHeight(dashletId) {
    const key = selfService.getDashletKey(dashletId);

    return get(getDashletSettings(key), DashletProps.CONTENT_HEIGHT);
  }

  static setDashletHeight(dashletId, height = null) {
    const key = selfService.getDashletKey(dashletId);
    const dashletData = getDashletSettings(key);

    if (height === null) {
      delete dashletData.contentHeight;
    } else {
      dashletData.contentHeight = height;
    }

    setData(key, dashletData);
  }

  static getDashletScale(dashletId) {
    const key = selfService.getDashletKey(dashletId);

    return get(getDashletSettings(key), DashletProps.CONTENT_SCALE);
  }

  static setDashletScale(dashletId, scale) {
    const key = selfService.getDashletKey(dashletId);
    const dashletData = getDashletSettings(key);

    dashletData.contentScale = scale;

    setData(key, dashletData);
  }
}

const selfService = UserLocalSettingsService;

export default UserLocalSettingsService;

export const DashletProps = {
  IS_COLLAPSED: 'isCollapsed',
  CONTENT_HEIGHT: 'contentHeight',
  CONTENT_SCALE: 'contentScale'
};

export const JournalProps = {
  PAGE_NUM: 'page-num',
  PAGE_SIZE: 'page-size',
  FILTERS: 'filters',
  SORTS: 'sorts'
};
