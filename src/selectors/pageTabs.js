import get from 'lodash/get';

export const selectTabs = state => get(state, ['pageTabs', 'tabs']) || [];
