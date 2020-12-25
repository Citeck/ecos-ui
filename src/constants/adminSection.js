import { URL } from './index';

export const Labels = {
  SHOW_MENU: 'bpmn-designer.sidebar.show',
  SHOW_MENU_sm: 'bpmn-designer.sidebar.show-sm',
  HIDE_MENU: 'bpmn-designer.sidebar.hide',
  HIDE_MENU_sm: 'bpmn-designer.sidebar.hide-sm',
  EMPTY_LIST: 'journals.menu.journal-list.empty'
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
