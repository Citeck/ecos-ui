import { URL } from './index';

export const Labels = {
  SHOW_MENU: 'admin-section.sidebar.show',
  SHOW_MENU_sm: 'admin-section.sidebar.show-sm',
  HIDE_MENU: 'admin-section.sidebar.hide',
  HIDE_MENU_sm: 'admin-section.sidebar.hide-sm',
  EMPTY_LIST: 'admin-section.sidebar.list-empty'
};

export const SectionTypes = {
  BPM: 'BPM',
  DEV_TOOLS: 'DEV_TOOLS',
  JOURNAL: 'JOURNAL'
};

export const SectionURL = {
  [SectionTypes.BPM]: URL.BPMN_DESIGNER,
  [SectionTypes.DEV_TOOLS]: URL.DEV_TOOLS
};

export const SectionNewTab = [SectionTypes.DEV_TOOLS];
