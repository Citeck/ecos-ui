import { get } from 'lodash';

export const selectIdentificationForView = state => get(state, 'dashboard.identification', {});
export const selectIdentificationForSet = state => get(state, 'dashboardSettings.identification', {});
