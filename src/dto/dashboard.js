import { get, isEmpty, last } from 'lodash';

export default class DashboardConverter {
  static getDashboardForWeb(source) {
    const target = {};

    if (!isEmpty(source)) {
      const { config, key, id = '', type } = source;
      const layout = get(config, ['layout']) || {};

      target.identification = { key, type, id: last(id.split('@')) };
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
