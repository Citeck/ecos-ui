import { getData, setData } from '../helpers/ls';
import { get, isEmpty } from 'lodash';

export default class UserLocalSettingsService {
  static getDashletSettings(dashletId) {
    let dashletData = getData(dashletId);

    if (isEmpty(dashletData)) {
      dashletData = {};
    }

    return dashletData;
  }

  static getDashletHeight(dashletId) {
    return get(UserLocalSettingsService.getDashletSettings(dashletId), 'height');
  }

  static setDashletHeight(dashletId, height) {
    const dashletData = UserLocalSettingsService.getDashletSettings(dashletId);

    dashletData.height = height;

    setData(dashletId, dashletData);
  }
}
