import { get } from 'lodash';

export const selectIdentificationForView = state => get(state, 'dashboard.identification', {});
export const selectIdentificationForSet = state => get(state, 'dashboardSettings.identification', {});

export const selectDashboardConfigs = state => {
  return {
    layouts: get(state, 'dashboard.config', []),
    mobile: get(state, 'dashboard.mobileConfig', []),
    isMobile: get(state, 'view.isMobile', false)
  };
};
