import { get, isEmpty } from 'lodash';
import moment from 'moment';
import { TITLE } from '../constants/pageTabs';
import { DASHBOARD_DEFAULT_KEY } from '../constants';
import DashboardService from '../services/dashboard';

export default class DashboardConverter {
  static getKeyInfoDashboardForWeb(source) {
    const target = {};

    if (!isEmpty(source)) {
      const { key, id = '', type, user } = source;

      target.identification = {
        key: key || DASHBOARD_DEFAULT_KEY,
        type,
        user,
        id
      };
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
    const target = {};

    if (!isEmpty(source)) {
      const { modifier, modified = '', displayName = '', version = '' } = source;

      target.version = version;
      target.name = displayName || TITLE.NO_NAME;

      target.date = '';
      target.modifierName = '';
      target.modifierUrl = '';

      if (!isEmpty(modifier)) {
        target.modifierName = modifier.disp;
        target.modifierUrl = `/share/page/user/${modifier.str}/profile`;
      }

      if (modified) {
        target.date = moment(modified)
          .utc()
          .format('ddd D MMM YYYY H:m:s');
      }
    }

    return target;
  }
}
