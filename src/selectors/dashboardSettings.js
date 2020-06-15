import get from 'lodash/get';
import { createSelector } from 'reselect';

import { initialState } from '../reducers/dashboardSettings';
import { isExistValue } from '../helpers/util';

const selectState = (state, key) => get(state, ['dashboardSettings', key], { ...initialState });

export const selectStateByKey = createSelector(
  selectState,
  ownState => {
    const config = get(ownState, 'config', {});

    return {
      config: get(config, 'layouts', []),
      mobileConfig: get(config, 'mobile', []),
      availableWidgets: get(ownState, 'availableWidgets', []),
      isLoading: get(ownState, 'isLoading', false),
      requestResult: get(ownState, 'requestResult', {}),
      identification: get(ownState, 'identification', {}),
      dashboardKeyItems: get(ownState, 'dashboardKeys', []),
      isDefaultConfig: !isExistValue(get(ownState, 'identification.user'))
    };
  }
);
