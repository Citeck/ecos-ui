import { select } from 'redux-saga/effects';

import { selectIdentificationForView } from '../selectors/dashboard';
import { getSearchParams, SEARCH_KEYS } from '../helpers/urls';

export default class MenuService {
  static processTransitSiteMenuItem = function*(menuItem) {
    const dashboard = yield select(selectIdentificationForView);
    const { recordRef, dashboardKey } = getSearchParams();
    const params = [];
    let link = menuItem.targetUrl;

    if (menuItem.id === 'SETTINGS_HOME_PAGE') {
      params.push(`${SEARCH_KEYS.DASHBOARD_ID}=${dashboard.id}`);

      if (recordRef) {
        params.push(`${SEARCH_KEYS.RECORD_REF}=${recordRef}`);
      }

      if (dashboardKey) {
        params.push(`${SEARCH_KEYS.DASHBOARD_KEY}=${dashboardKey}`);
      }
    }

    link += `?${params.join('&')}`;

    return link;
  };
}
