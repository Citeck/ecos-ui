import { get } from 'lodash';

import pageTabList from '../services/pageTabs/PageTabList';

export const selectIdentificationForView = state => get(state, `dashboard[${pageTabList.activeTabId}].identification`, {});
export const selectIdentificationForSet = state => get(state, 'dashboardSettings.identification', {});
export const selectResetStatus = state => get(state, 'dashboard.reset', false);

export const selectDashboardConfigs = state => {
  return {
    layouts: get(state, 'dashboard.config', []),
    mobile: get(state, 'dashboard.mobileConfig', []),
    isMobile: get(state, 'view.isMobile', false)
  };
};
