import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';

import { TITLE } from '../constants/pageTabs';
import DashboardService from '../services/dashboard';

export default class DashboardConverter {
  static getKeyInfoDashboardForWeb(source) {
    const target = {};

    if (!isEmpty(source)) {
      const { key, type, user } = source;
      const id = DashboardService.formShortId(source.id);

      target.identification = { key, type, user, id };
    }

    return target;
  }

  static getDashboardLayoutForWeb(source) {
    const target = {};

    if (!isEmpty(source)) {
      target.id = source.id;
      target.tab = source.tab || {};
      target.type = source.type || '';
      target.columns = source.columns || [];
    }

    return target;
  }

  static getDashboardForWeb(source) {
    const target = [];

    if (!isEmpty(source)) {
      const { config } = source;
      const layouts = get(config, ['layouts'], []);

      DashboardService.movedToListLayout(config, layouts);

      layouts.forEach(item => {
        target.push(DashboardConverter.getDashboardLayoutForWeb(item));
      });
    }

    return target;
  }

  static getMobileDashboardForWeb(source) {
    const target = [];

    if (!isEmpty(source)) {
      const { config } = source;
      const layouts = get(config, ['layouts'], []);

      DashboardService.movedToListLayout(config, layouts);

      let mobile = get(config, ['mobile']);

      if (isEmpty(mobile)) {
        mobile = DashboardService.generateMobileConfig(layouts);
      }

      mobile.forEach(item => {
        target.push(DashboardConverter.getDashboardLayoutForWeb(item));
      });
    }

    return target;
  }

  static getTitleInfo(source = {}) {
    const target = {};

    if (!isEmpty(source)) {
      const { displayName = '', version = '' } = source;

      target.version = version;
      target.name = displayName || TITLE.NO_NAME;
    }

    return target;
  }
}
