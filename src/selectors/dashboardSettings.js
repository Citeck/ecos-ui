import get from 'lodash/get';
import cloneDeep from 'lodash/cloneDeep';
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
      isLoading: get(ownState, 'isLoading', false),
      requestResult: get(ownState, 'requestResult', {}),
      identification: get(ownState, 'identification', {}),
      dashboardKeyItems: get(ownState, 'dashboardKeys', []),
      isDefaultConfig: !isExistValue(get(ownState, 'identification.user')),
      selectedDesktopWidgets: selectAllSelectedWidgets(layouts)
    };
  }
);

export const selectAllSelectedWidgets = createSelector(
  config => config,
  config => DashboardService.getSelectedWidgetsByIdFromDesktopConfig(config)
);

export const selectNewVersionConfig = createSelector(
  config => config,
  config => get(config, config.version, [])
);

export const selectSelectedWidgetsById = createSelector(
  config => get(config, 'widgets', []),
  widgets => DashboardService.getWidgetsById(widgets)
);

export const selectOriginalConfig = createSelector(
  selectState,
  ownState => get(ownState, 'originalConfig', [])
);
