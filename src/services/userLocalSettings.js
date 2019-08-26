import { getData, setData, transferData } from '../helpers/ls';
import { get, isEmpty } from 'lodash';

const prefix = 'dashletSettings_';

function getDashletSettings(dashletId) {
  // let dashletData = getData(prefix + dashletId);
  let dashletData = getData(dashletId);

  if (isEmpty(dashletData)) {
    dashletData = {};
  }

  return dashletData;
}

function setDashletSettings(dashletId, data) {
  // setData(prefix + dashletId, data);
  setData(dashletId, data);
}

export default class UserLocalSettingsService {
  static getPrefix = () => prefix;

  static transferData(oldKey, newKey) {
    transferData(oldKey, newKey, true);
  }

  static getDashletHeight(dashletId) {
    return get(getDashletSettings(dashletId), 'contentHeight');
  }

  static setDashletHeight(dashletId, height) {
    const dashletData = getDashletSettings(dashletId);

    dashletData.contentHeight = height;

    setDashletSettings(dashletId, dashletData);
  }

  static getDashletScale(dashletId) {
    return get(getDashletSettings(dashletId), 'contentScale');
  }

  static setDashletScale(dashletId, scale) {
    const dashletData = getDashletSettings(dashletId);

    dashletData.contentScale = scale;

    setDashletSettings(dashletId, dashletData);
  }
}
