import get from 'lodash/get';
import { createSelector } from 'reselect';

import { initialState } from '../reducers/dashboardSettings';
import { isExistValue } from '../helpers/util';
import DashboardService from '../services/dashboard';

const selectState = (state, key) => get(state, ['dashboardSettings', key], { ...initialState });

export const selectStateByKey = createSelector(
  selectState,
  ownState => {
    const config = get(ownState, 'config', {});
    const layouts = get(config, 'layouts', []);

    return {
      config: layouts,
      mobileConfig: get(config, 'mobile', []),
      availableWidgets: get(ownState, 'availableWidgets', []),
      modelAttributes: get(ownState, 'modelAttributes', []),
      isLoading: get(ownState, 'isLoading', false),
      isLoadingKeys: get(ownState, 'isLoadingKeys', false),
      requestResult: get(ownState, 'requestResult', {}),
      identification: get(ownState, 'identification', {}),
      dashboardKeyItems: get(ownState, 'dashboardKeys', []),
      recordRef: get(ownState, 'recordRef'),
      isDefaultConfig: !isExistValue(get(ownState, 'identification.user'))
    };
  }
);

export const selectNewVersionConfig = createSelector(
  config => config,
  config => get(config, config.version, [])
);

export const selectSelectedWidgetsById = createSelector(
  config => get(config, 'widgets', []),
  config => {
    const desktop = get(config, 'desktop', []);
    const tabByWidget = {};
    let tab = null;
    const eachColumn = column => {
      if (Array.isArray(column)) {
        column.forEach(eachColumn);
      } else {
        column.widgets.forEach(widget => {
          if (typeof widget === 'string') {
            tabByWidget[widget] = tab;
          } else {
            tabByWidget[widget.id] = tab;
          }
        });
      }
    };

    desktop.forEach(layout => {
      tab = layout.tab;
      layout.columns.forEach(eachColumn);
    });

    return tabByWidget;
  },
  (widgets, tabByWidget) => {
    const data = DashboardService.getWidgetsById(widgets);

    Object.keys(data).forEach(key => {
      data[key] = {
        ...data[key],
        description: tabByWidget[key].label
      };
    });

    return data;
  }
);

export const selectOriginalConfig = createSelector(
  selectState,
  ownState => get(ownState, 'originalConfig', [])
);

export const selectRecordRef = createSelector(
  selectState,
  ownState => get(ownState, 'recordRef')
);
