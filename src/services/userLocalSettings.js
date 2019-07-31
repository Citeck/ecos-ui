import { getData, setData } from '../helpers/ls';
import { get, isEmpty } from 'lodash';

const prefix = 'dashletSettings_';

export default class UserLocalSettingsService {
  static getDashletSettings(dashletId) {
    let dashletData = getData(prefix + dashletId);

    if (isEmpty(dashletData)) {
      dashletData = {};
    }

    return dashletData;
  }

  static setDashletSettings(dashletId, data) {
    setData(prefix + dashletId, data);
  }

  static getDashletHeight(dashletId) {
    return get(UserLocalSettingsService.getDashletSettings(dashletId), 'contentHeight');
  }

  static setDashletHeight(dashletId, height) {
    const dashletData = UserLocalSettingsService.getDashletSettings(dashletId);

    dashletData.contentHeight = height;

    UserLocalSettingsService.setDashletSettings(dashletId, dashletData);
  }

  static getDashletScale(dashletId) {
    return get(UserLocalSettingsService.getDashletSettings(dashletId), 'contentScale');
  }

  static setDashletScale(dashletId, scale) {
    const dashletData = UserLocalSettingsService.getDashletSettings(dashletId);

    dashletData.contentScale = scale;

    UserLocalSettingsService.setDashletSettings(dashletId, dashletData);
  }
}
