import cloneDeep from 'lodash/cloneDeep';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import isString from 'lodash/isString';
import React, { lazy, Suspense } from 'react';
import { Provider } from 'react-redux';
import uuid from 'uuid/v4';

import PageTabList from './pageTabs/PageTabList';

import { ParserPredicate } from '@/components/Filters/predicates';
import { Loader } from '@/components/common';
import DialogManager from '@/components/common/dialogs/Manager/DialogManager';
import { SourcesId } from '@/constants';
import { CONFIG_VERSION } from '@/constants/dashboard';
import { LayoutTypes } from '@/constants/layout';
import en from '@/i18n/en.json';
import ru from '@/i18n/ru.json';
import { getStore } from '@/store';

const separatorId = '@';

const Labels = {
  DEFAULT_TAB_NAME: 'page-tabs.tab-name-default'
};

export default class DashboardService {
  static SaveWays = {
    CREATE: 'CREATE',
    UPDATE: 'UPDATE',
    CONFIRM: 'CONFIRM'
  };

  static get key() {
    return PageTabList.activeTabId || null;
  }

  static get newIdLayout() {
    return `layout_${uuid()}`;
  }

  static defaultDashboardTab = idLayout => ({
    label: {
      ru: ru[Labels.DEFAULT_TAB_NAME],
      en: en[Labels.DEFAULT_TAB_NAME]
    },
    idLayout
  });

  static defaultDashboardConfig = idLayout => ({
    layout: {
      id: idLayout,
      tab: DashboardService.defaultDashboardTab(idLayout),
      type: LayoutTypes.TWO_COLUMNS_BS,
      columns: [
        {
          width: '30%',
          widgets: []
        },
        {
          widgets: []
        }
      ]
    }
  });

  static getEmptyDashboardConfig = () => {
    return {
      version: CONFIG_VERSION,
      [CONFIG_VERSION]: {
        widgets: [],
        desktop: [DashboardService.defaultDashboardConfig(DashboardService.newIdLayout).layout],
        mobile: []
      }
    };
  };

  static formShortId(id) {
    return (id || '').replace(SourcesId.DASHBOARD + separatorId, '');
  }

  static isDashboardRecord(recordRef = '') {
    return recordRef.indexOf(SourcesId.DASHBOARD) === 0;
  }

  static checkDashboardResult(result) {
    if (isEmpty(result)) {
      return [DashboardService.defaultDashboardConfig(DashboardService.newIdLayout)];
    }

    return result || [];
  }

  static parseRequestResult(result) {
    if (isEmpty(result)) {
      return {};
    }

    const fullId = result.id || '';
    const dashboardId = DashboardService.formShortId(fullId);

    return {
      dashboardId
    };
  }

  static getCacheKey({ type, user, wsId } = {}) {
    if (!get(window, 'Citeck.navigator.WORKSPACES_ENABLED', false)) {
      return `${type}|${user}`;
    }

    return `${type}|${user}|${wsId}`;
  }

  static defineWaySavingDashboard(eqKey, allUser, hasUser) {
    switch (true) {
      case eqKey && !allUser && !hasUser:
        return DashboardService.SaveWays.CREATE;
      case eqKey && !allUser && hasUser:
      case eqKey && allUser && !hasUser:
        return DashboardService.SaveWays.UPDATE;
      case !eqKey || (eqKey && allUser && hasUser):
      default:
        return DashboardService.SaveWays.CONFIRM;
    }
  }

  /**
   * for old version, which has one layout (just object) without tab
   * @param config
   * @param layouts
   */
  static movedToListLayout(config, layouts) {
    if (isEmpty(layouts)) {
      const layout = get(config, ['layout'], {});

      layout.id = DashboardService.newIdLayout;
      layout.tab = DashboardService.defaultDashboardTab(layout.id);

      if (!isEmpty(layout)) {
        layouts.push(layout);
      }
    }
  }

  static generateNewMobileConfig(source = []) {
    const mobile = [];

    source.forEach(layout => {
      const { id: idLayout, columns = [], tab = {} } = layout;

      mobile.push({
        id: idLayout,
        tab: { label: tab.label, idLayout },
        type: LayoutTypes.MOBILE,
        columns: [
          {
            widgets: columns.reduce((result, current) => {
              if (Array.isArray(current)) {
                return [
                  ...result,
                  ...[].concat.apply(
                    [],
                    current.map(item => get(item, 'widgets', []))
                  )
                ];
              }

              return [...result, ...get(current, 'widgets', [])];
            }, [])
          }
        ]
      });
    });

    return mobile;
  }

  static getWidgetsById(widgets = []) {
    return widgets.reduce(
      (res, widget) => ({
        ...res,
        [widget.id]: widget
      }),
      {}
    );
  }

  static migrateConfigFromOldVersion(data) {
    const source = cloneDeep(data);
    const version = get(source, 'version');
    const newVersionConfig = get(source, version, []);

    const updWidgetProps = widgets => {
      function getJson(data) {
        const val = JSON.parse(data);
        return val && (Array.isArray(val) ? val : [val]);
      }

      widgets &&
        widgets.forEach(w => {
          const widgetDisplayCondition = get(w, 'props.config.widgetDisplayCondition');
          const elementsDisplayCondition = get(w, 'props.config.elementsDisplayCondition');

          if (widgetDisplayCondition && isString(widgetDisplayCondition)) {
            w.props.config.widgetDisplayCondition = ParserPredicate.getWrappedPredicate(getJson(widgetDisplayCondition));
          }

          elementsDisplayCondition &&
            Object.keys(elementsDisplayCondition).forEach(key => {
              if (elementsDisplayCondition[key] && isString(elementsDisplayCondition[key])) {
                elementsDisplayCondition[key] = ParserPredicate.getWrappedPredicate(getJson(elementsDisplayCondition[key]));
              }
            });
        });
    };

    if (version === CONFIG_VERSION && !isEmpty(newVersionConfig)) {
      updWidgetProps(source[CONFIG_VERSION].widgets);
      return source;
    }

    const getWidgetsFromColumn = (widget, column) => {
      if (Array.isArray(widget)) {
        return widget.map(widget => getWidgetsFromColumn(widget, column));
      } else {
        widgets.push(widget);
        return widget.id;
      }
    };
    const getWidgetFromLayout = column => {
      if (Array.isArray(column)) {
        return column.map((widget, index) => getWidgetFromLayout(widget, column[index]));
      } else {
        return {
          ...column,
          widgets: get(column, 'widgets', []).map(widget => getWidgetsFromColumn(widget, column))
        };
      }
    };

    let mobile = get(source, 'mobile', []);
    let desktop = get(source, 'layouts', []);
    const widgets = [];

    if (isEmpty(desktop)) {
      const layout = {};

      layout.id = DashboardService.newIdLayout;
      layout.tab = DashboardService.defaultDashboardTab(layout.id);

      desktop = [layout];
    }

    desktop = desktop.map(layout => {
      return {
        ...layout,
        columns: getWidgetFromLayout(get(layout, 'columns', []))
      };
    });

    if (isEmpty(mobile)) {
      mobile = DashboardService.generateNewMobileConfig(desktop);
    }

    updWidgetProps(widgets);

    return {
      ...source,
      version: CONFIG_VERSION,
      [CONFIG_VERSION]: {
        mobile,
        desktop,
        widgets
      }
    };
  }

  static openEditModal(props = {}) {
    const Settings = lazy(() => import('../components/DashboardSettings/Settings'));
    const store = getStore();
    const modalRef = React.createRef();

    let { title, onSave = () => {}, onClose = () => {}, ...otherProps } = props;

    const dialog = DialogManager.showCustomDialog({
      isVisible: true,
      title,
      className: 'ecos-dashboard-settings-modal-wrapper ecos-modal_width-lg',
      isTopDivider: true,
      isBigHeader: true,
      reactstrapProps: { ref: modalRef, backdrop: 'static' },
      onHide: () => dialog.setVisible(false),
      body: (
        <Provider store={store}>
          <Suspense fallback={<Loader type="points" />}>
            <Settings
              modalRef={modalRef}
              tabId={PageTabList.activeTabId}
              onSetDialogProps={props => dialog.updateProps(props)}
              getDialogTitle={() => get(dialog, 'props.dialogProps.title')}
              onSave={() => {
                dialog.setVisible(false);
                onSave();
              }}
              onClose={() => {
                dialog.setVisible(false);
                onClose();
              }}
              {...otherProps}
            />
          </Suspense>
        </Provider>
      )
    });
  }
}
