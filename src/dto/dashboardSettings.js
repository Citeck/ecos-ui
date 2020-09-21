import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import isArray from 'lodash/isArray';
import head from 'lodash/head';

import { MOBILE_SETTINGS_CONFIG_VERSION } from '../constants/dashboard';
import { Layouts, LayoutTypes } from '../constants/layout';
import Components from '../components/widgets/Components';
import DashboardService from '../services/dashboard';
import DashboardConverter from './dashboard';

export default class DashboardSettingsConverter {
  static getSettingsForWeb(source = {}, widgetsById) {
    let target = {};

    if (!isEmpty(source)) {
      const { config } = source;

      // target.identification = DashboardConverter.getKeyInfoDashboardForWeb(source).identification;

      target.config = {
        layouts: DashboardSettingsConverter.getDesktopConfigForWeb(source, widgetsById),
        mobile: DashboardSettingsConverter.getMobileConfigForWeb(source, widgetsById)
      };
    }

    return target;
  }

  static getDesktopConfigForWeb(config, widgetsById) {
    const target = [];
    const layouts = get(config, ['desktop'], []);

    console.warn({ layouts, config });

    // DashboardService.movedToListLayout(config, layouts);

    layouts.forEach(layout => {
      target.push(DashboardSettingsConverter.getSettingsLayoutForWeb(layout, widgetsById));
    });

    return target;
  }

  static getMobileConfigForWeb(config) {
    const target = [];
    const layouts = get(config, ['layouts'], []);
    const mobileVersion = get(config, 'mobileVersion');

    DashboardService.movedToListLayout(config, layouts);

    let mobile = get(config, ['mobile']);

    if (isEmpty(mobile) || mobileVersion !== MOBILE_SETTINGS_CONFIG_VERSION) {
      // mobile = DashboardService.generateMobileConfig(layouts);

      // mobile = DashboardService.generateMobileConfigByDesktop(layouts);
      console.warn('empty, generate new', {
        selectedById: DashboardService.getSelectedWidgetsByIdFromDesktopConfig(layouts),
        mobileConfig: DashboardService.generateMobileConfig(layouts),
        newMobileConfig: DashboardService.generateNewMobileConfig(layouts)
      });
    }

    mobile.forEach(layout => {
      target.push(DashboardSettingsConverter.getSettingsLayoutForWeb(layout));
    });

    return target;
  }

  static getSettingsLayoutForWeb(layout = {}, widgetsById) {
    let target = {};

    target.id = layout.id;
    target.tab = layout.tab || DashboardService.defaultDashboardTab(layout.id);
    target.type = layout.type || LayoutTypes.TWO_COLUMNS_BS;
    target.widgets = isArray(layout.columns)
      ? [].concat.apply([], layout.columns).map(item =>
          item.widgets.map(widget => {
            if (typeof widget === 'string') {
              return widgetsById[widget];
            }

            return widget;
          })
        )
      : [];

    return target;
  }

  static getSettingsConfigForServer(source) {
    const target = [];
    const { tabs = [], layoutType, widgets = {} } = source;

    tabs.forEach(tab => {
      const { label, idLayout } = tab;
      const type = layoutType[idLayout] || LayoutTypes.TWO_COLUMNS_BS;
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
        type: LayoutTypes.MOBILE,
        columns: [
          {
            widgets: head(Components.setDefaultPropsOfWidgets(mobile.widgets[idLayout])) || []
          }
        ]
      });
    });

    return target;
  }

  static getSettingsMobileConfigForServerV2(source) {
    const { mobile } = source;
    const target = [];

    mobile.tabs.forEach(tab => {
      const { label, idLayout } = tab;
      const widgets = head(Components.setDefaultPropsOfWidgets(mobile.widgets[idLayout])) || [];

      target.push({
        id: idLayout,
        tab: { label, idLayout },
        type: LayoutTypes.MOBILE,
        columns: [
          {
            widgets: widgets.map(widget => widget.id)
          }
        ]
      });
    });

    return target;
  }

  static getWidgetsForServer(columns = [], widgets = []) {
    let defProps = Components.setDefaultPropsOfWidgets(widgets);
    let order = 0;
    const getWidget = column => {
      const data = {
        widgets: defProps[order] || []
      };

      if (column.width) {
        data.width = column.width;
      }

      order += 1;

      return data;
    };

    return columns.map(column => {
      if (Array.isArray(column)) {
        return column.map(getWidget);
      }

      return getWidget(column);
    });
  }
}
