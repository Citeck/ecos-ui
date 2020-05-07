import { get } from 'lodash';

import DashboardService from '../services/dashboard';
import { initialState } from '../reducers/dashboard';

export const selectIdentificationForView = state => get(state, `dashboard[${DashboardService.key}].identification`, {});
export const selectIdentificationForSet = state => get(state, 'dashboardSettings.identification', {});
export const selectResetStatus = state => get(state, `dashboard[${DashboardService.key}].reset`, false);
export const selectDashboardByKey = (state, key) => get(state, ['dashboard', key], initialState);

export const selectDashboardConfigs = state => {
  return {
    layouts: get(state, `dashboard[${DashboardService.key}].config`, []),
    mobile: get(state, `dashboard[${DashboardService.key}].mobileConfig`, []),
    isMobile: get(state, 'view.isMobile', false)
  };
};
