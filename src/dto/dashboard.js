import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import moment from 'moment';

import DashboardService from '../services/dashboard';

export default class DashboardConverter {
  static getKeyInfoDashboardForWeb(source) {
    const target = {};

    if (!isEmpty(source)) {
      const { key, id = '', type } = source;

      target.identification = { key, type, id: DashboardService.parseDashboardId(id) };
    }

    return target;
  }

  static getDashboardForWeb(source) {
    const target = {};

    if (!isEmpty(source)) {
      const { config } = source;
      const layout = get(config, ['layout']) || {};

      target.columns = layout.columns || [];
      target.type = layout.type;
    }

    return target;
  }

  static getDashboardForServer(source) {
    if (isEmpty(source)) {
      return {};
    }

    const {
      config: { columns, type }
    } = source;

    return { layout: { columns, type } };
  }

  static getTitleInfo(source = {}) {
    const { modifier = {}, modified = '', displayName = '', version = '' } = source;
    const target = {
      version,
      name: displayName,
      date: '',
      modifierName: '',
      modifierUrl: ''
    };

    if (Object.keys(modifier).length) {
      target.modifierName = modifier.disp;
      target.modifierUrl = `/share/page/user/${modifier.str}/profile`;
    }

    if (modified) {
      target.date = moment(modified)
        .utc()
        .format('ddd D MMM YYYY H:m:s');
    }

    return target;
  }
}
