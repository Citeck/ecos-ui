import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import { LAYOUT_TYPE } from '../constants/layout';
import { Layouts } from '../constants/dashboard';
import Components from '../components/Components';
import MenuConverter from './menu';
import DashboardConverter from './dashboard';
import DashboardService from '../services/dashboard';

export default class DashboardSettingsConverter {
  static getSettingsConfigForWeb(source = {}) {
    let target = {};

    if (!isEmpty(source)) {
      const { config } = source;

      target.identification = DashboardConverter.getKeyInfoDashboardForWeb(source).identification;

      const layouts = get(config, ['layouts'], []);

      DashboardService.movedToListLayout(config, layouts);

      const mobile = get(config, ['mobile'], DashboardService.generateMobileConfig(layouts));

      target.config = {
        layouts: [],
        mobile: []
      };

      layouts.forEach(layout => {
        target.config.layouts.push(DashboardSettingsConverter.getSettingsLayoutForWeb(layout));
      });

      mobile.forEach(layout => {
        target.config.mobile.push(DashboardSettingsConverter.getSettingsLayoutForWeb(layout));
      });
    }

    return target;
  }

  static getSettingsLayoutForWeb(layout = {}) {
    let target = {};

    target.id = layout.id;
    target.tab = layout.tab || DashboardService.defaultDashboardTab(layout.id);
    target.type = layout.type || LAYOUT_TYPE.TWO_COLUMNS_BS;
    target.widgets = !isEmpty(layout.columns) ? layout.columns.map(item => item.widgets) : [];

    return target;
  }

  static getSettingsConfigForServer(source) {
    const target = {
      layouts: [],
      menu: {},
      mobile: []
    };

    const { menuType, menuLinks, layoutType, widgets } = source;

    target.menu.type = menuType;
    target.menu.links = MenuConverter.getMenuItemsForServer(menuLinks);

    source.tabs.forEach(tab => {
      const { label, idLayout } = tab;
      const type = layoutType[idLayout] || LAYOUT_TYPE.TWO_COLUMNS_BS;
      const columns = Layouts.find(layout => layout.type === type).columns;

      target.layouts.push({
        id: idLayout,
        tab: { label, idLayout },
        type,
        columns: DashboardSettingsConverter.getWidgetsForServer(columns, widgets[idLayout])
      });

      target.mobile.push({
        id: idLayout,
        tab: { label, idLayout },
        type: LAYOUT_TYPE.MOBILE,
        columns: [
          {
            widgets: DashboardSettingsConverter.getWidgetsForServer(columns, widgets[idLayout]).reduce(
              (result, current) => [...result, ...current.widgets],
              []
            )
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
