import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
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
}
