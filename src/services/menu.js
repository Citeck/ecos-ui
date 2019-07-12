import { select } from 'redux-saga/effects';
import { selectIdentificationForView } from '../selectors/dashboard';

export default class MenuService {
  static processTransitSiteMenuItem = function*(menuItem) {
    const dashboard = yield select(selectIdentificationForView);

    let link = menuItem.targetUrl;

    if (menuItem.id === 'SETTINGS_HOME_PAGE') {
      link += '?dashboardId=' + dashboard.id;
    }

    return link;
  };
}
