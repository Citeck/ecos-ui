import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import isArray from 'lodash/isArray';
import head from 'lodash/head';
import cloneDeep from 'lodash/cloneDeep';

import { CONFIG_VERSION } from '../constants/dashboard';
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

  static getMobileConfigForWeb(config, widgetsById) {
    const target = [];
    const version = get(config, 'version');
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
      target.push(DashboardSettingsConverter.getSettingsLayoutForWeb(layout, widgetsById));
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

  static getSettingsMobileConfigForServerV2(source, allWidgets) {
    const { mobile } = source;
    const target = [];
    const byId = DashboardService.getWidgetsById(allWidgets);

    mobile.tabs.forEach(tab => {
      const { label, idLayout } = tab;
      const widgets = head(Components.setDefaultPropsOfWidgets(mobile.widgets[idLayout])) || [];

      target.push({
        id: idLayout,
        tab: { label, idLayout },
        type: LayoutTypes.MOBILE,
        columns: [
          {
            widgets: widgets
              .map(widget => {
                if (byId[widget.id]) {
                  return widget.id;
                }

                widget = allWidgets.find(w => w.name === widget.name);

                if (!widget) {
                  return null;
                }

                return widget.id;
              })
              .filter(item => !isEmpty(item))
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

  static getNewWidgetsForServer(source = {}) {
    const widgets = Object.keys(source).reduce((result, key) => {
      console.warn(source[key]);
      const layoutWidgets = source[key].reduce((outcome, current) => {
        outcome.push(...current);

        return outcome;
      }, []);

      result.push(...layoutWidgets);

      return result;
    }, []);

    return Components.setDefaultPropsOfWidgets(widgets);
  }

  static getNewDesktopConfigForServer(tabs = [], layoutType, widgets) {
    const target = [];

    tabs.forEach(tab => {
      let order = 0;
      const { label, idLayout } = tab;
      const layoutWidgets = get(widgets, idLayout, []);
      const type = layoutType[idLayout] || LayoutTypes.TWO_COLUMNS_BS;
      const columns = Layouts.find(layout => layout.type === type).columns;
      const getWidget = column => {
        const data = {
          widgets: layoutWidgets[order].map(widget => Components.getDefaultWidget(widget).id) || []
        };

        if (column.width) {
          data.width = column.width;
        }

        order += 1;

        return data;
      };

      target.push({
        id: idLayout,
        tab: { label, idLayout },
        type,
        columns: columns.map(column => {
          if (Array.isArray(column)) {
            return column.map(getWidget);
          }

          return getWidget(column);
        })
      });
    });

    return target;
  }

  static getNewSettingsConfigForServer(data) {
    const source = cloneDeep(data);
    const target = {};
    const { tabs = [], layoutType, widgets = {} } = source;
    const allWidgets = DashboardSettingsConverter.getNewWidgetsForServer(widgets);
    const desktop = DashboardSettingsConverter.getNewDesktopConfigForServer(tabs, layoutType, widgets);
    const mobile = DashboardSettingsConverter.getSettingsMobileConfigForServerV2(source, allWidgets);

    target.widgets = allWidgets;

    return {
      widgets: allWidgets,
      desktop,
      mobile
    };
  }
}
