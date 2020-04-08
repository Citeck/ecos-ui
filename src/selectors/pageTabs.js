import get from 'lodash/get';

export const selectTabs = state => get(state, ['pageTabs', 'tabs'], []);
export const selectInitStatus = state => get(state, ['pageTabs', 'inited'], false);
export const selectActiveTab = state => get(state, ['pageTabs', 'tabs'], []).find(item => item.isActive);
