import { getCurrentLocale } from '../helpers/util';

export const Documentation = {
  get BASE_URL() {
    return 'https://citeck-ecos.readthedocs.io/' + getCurrentLocale();
  },
  get FORM_COMPONENTS_URL() {
    return this.BASE_URL + '/latest/settings_kb/interface/forms/form_components/components_common.html#';
  }
};

export const DocCompMap = {
  asyncData: 'async-data',
  button: 'button',
  checkbox: 'checkbox',
  columns: 'columns',
  datetime: 'date-time',
  day: 'day',
  ecosSelect: 'ecos-select',
  email: 'email',
  file: 'file',
  horizontalLine: 'horizontal-line',
  htmlelement: 'html-element',
  mlText: 'ml-text',
  mlTextarea: 'ml-textarea',
  number: 'number',
  panel: 'panel',
  phoneNumber: 'phone-number',
  address: 'address-field',
  selectJournal: 'select-journal',
  selectAction: 'select-action',
  selectOrgstruct: 'select-orgstruct',
  table: 'table',
  container: 'container',
  tableForm: 'table-form',
  tabs: 'tabs',
  taskOutcome: 'task-outcome',
  textarea: 'text-area',
  textfield: 'text-field',
  url: 'url',
  hidden: 'hidden',
  importButton: 'import-button',
  datagrid: 'data-grid',
  dataGridAssoc: 'data-grid-assoc',
  dataMap: 'data-map',
  includeForm: 'include-form'
};

export const getCompDoc = keyComp => {
  return DocCompMap[keyComp] && Documentation.FORM_COMPONENTS_URL + DocCompMap[keyComp];
};
