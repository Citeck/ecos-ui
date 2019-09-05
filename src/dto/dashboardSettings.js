import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import isArray from 'lodash/isArray';
import head from 'lodash/head';
import { LAYOUT_TYPE } from '../constants/layout';
import { Layouts } from '../constants/dashboard';
import Components from '../components/Components';
import DashboardService from '../services/dashboard';
import DashboardConverter from './dashboard';

export default class DashboardSettingsConverter {
  static getSettingsForWeb(source = {}) {
    let target = {};

    if (!isEmpty(source)) {
      const { config } = source;

      target.identification = DashboardConverter.getKeyInfoDashboardForWeb(source).identification;

      target.config = {
        layouts: DashboardSettingsConverter.getDescConfigForWeb(config),
        mobile: DashboardSettingsConverter.getMobileConfigForWeb(config)
      };
    }

    return target;
  }

  static getDescConfigForWeb(config) {
    const target = [];

    const layouts = get(config, ['layouts'], []);

    DashboardService.movedToListLayout(config, layouts);

    layouts.forEach(layout => {
      target.push(DashboardSettingsConverter.getSettingsLayoutForWeb(layout));
    });

    return target;
  }

  static getMobileConfigForWeb(config) {
    const target = [];

    const layouts = get(config, ['layouts'], []);

    DashboardService.movedToListLayout(config, layouts);

    const mobile = get(config, ['mobile'], DashboardService.generateMobileConfig(layouts));

    mobile.forEach(layout => {
      target.push(DashboardSettingsConverter.getSettingsLayoutForWeb(layout));
    });

    return target;
  }

  static getSettingsLayoutForWeb(layout = {}) {
    let target = {};

    target.id = layout.id;
    target.tab = layout.tab || DashboardService.defaultDashboardTab(layout.id);
    target.type = layout.type || LAYOUT_TYPE.TWO_COLUMNS_BS;
    target.widgets = isArray(layout.columns) ? layout.columns.map(item => item.widgets) : [];

    return target;
  }

  static getSettingsConfigForServer(source) {
    const target = [];

    const { tabs = [], layoutType, widgets = {} } = source;

    tabs.forEach(tab => {
      const { label, idLayout } = tab;
      const type = layoutType[idLayout] || LAYOUT_TYPE.TWO_COLUMNS_BS;
      const columns = Layouts.find(layout => layout.type === type).columns;

      target.push({
        id: idLayout,
        tab: { label, idLayout },
        type,
        columns: DashboardSettingsConverter.getWidgetsForServer(columns, widgets[idLayout])
      });
    });

    return target;
  }

  static getSettingsMobileConfigForServer(source) {
    const { mobile } = source;
    const target = [];

    mobile.tabs.forEach(tab => {
      const { label, idLayout } = tab;

      target.push({
        id: idLayout,
        tab: { label, idLayout },
        type: LAYOUT_TYPE.MOBILE,
        columns: [
          {
            widgets: head(Components.setDefaultPropsOfWidgets(mobile.widgets[idLayout])) || []
          }
        ]
      });
    });

    return target;
  }

  static getWidgetsForServer(columns = [], widgets = []) {
    let defProps = Components.setDefaultPropsOfWidgets(widgets);

    return columns.map((column, index) => {
      const data = {
        widgets: defProps[index] || []
      };

      if (column.width) {
        data.width = column.width;
      }

      return data;
    });
  }
}
