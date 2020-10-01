import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';

import { TITLE } from '../constants/pageTabs';
import DashboardService from '../services/dashboard';
import cloneDeep from 'lodash/cloneDeep';
import { CONFIG_VERSION } from '../constants/dashboard';

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

  static getNewDashboardLayoutForWeb(source = {}, widgetsById) {
    const target = {};
    const eachColumn = column => {
      if (Array.isArray(column)) {
        return column.map(eachColumn);
      }

      return {
        ...column,
        widgets: column.widgets.map(widget => {
          if (typeof widget === 'string') {
            return widgetsById[widget];
          }

          return widget;
        })
      };
    };

    if (!isEmpty(source)) {
      target.id = source.id;
      target.tab = source.tab || {};
      target.type = source.type || '';
      target.columns = Array.isArray(source.columns) ? source.columns.map(eachColumn) : [];
    }

    return target;
  }

  static getDesktopConfigForWeb(config, widgetsById) {
    const target = [];
    const layouts = get(config, ['desktop'], []);

    layouts.forEach(layout => {
      target.push(DashboardConverter.getNewDashboardLayoutForWeb(layout, widgetsById));
    });

    return target;
  }

  static getMobileConfigForWeb(config, widgetsById, version) {
    const target = [];
    let layouts = get(config, ['layouts'], []);

    if (isEmpty(layouts)) {
      layouts = get(config, ['desktop'], []);
    }

    DashboardService.movedToListLayout(config, layouts);

    let mobile = get(config, ['mobile']);

    if (isEmpty(mobile) || version !== CONFIG_VERSION) {
      mobile = DashboardService.generateNewMobileConfig(layouts);
    }

    mobile.forEach(layout => {
      target.push(DashboardConverter.getNewDashboardLayoutForWeb(layout, widgetsById));
    });

    return target;
  }

  static getNewDashboardForWeb(data = {}, widgetsById, version) {
    const source = cloneDeep(data);
    let target = {};

    if (!isEmpty(source)) {
      target.config = {
        layouts: DashboardConverter.getDesktopConfigForWeb(source, widgetsById),
        mobile: DashboardConverter.getMobileConfigForWeb(source, widgetsById, version)
      };
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
