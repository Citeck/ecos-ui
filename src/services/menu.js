import { select } from 'redux-saga/effects';
import { selectIdentificationForView } from '../selectors/dashboard';
import { getSearchParams } from '../helpers/urls';

export default class MenuService {
  static processTransitSiteMenuItem = function*(menuItem) {
    const dashboard = yield select(selectIdentificationForView);
    const { recordRef, dashboardKey } = getSearchParams();
    const params = [];
    let link = menuItem.targetUrl;

    if (menuItem.id === 'SETTINGS_HOME_PAGE') {
      params.push(`dashboardId=${dashboard.id}`);

      if (recordRef) {
        params.push(`recordRef=${recordRef}`);
      }

      if (dashboardKey) {
        params.push(`dashboardKey=${dashboardKey}`);
      }
    }

    link += `?${params.join('&')}`;

    return link;
  };
}
