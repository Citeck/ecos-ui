import { BpmnProcessStatusColumn } from '../../../components/BpmnProcessStatusColumn';
import { URL } from '../../../constants';
import { getMLValue } from '../../../helpers/util';

export const PROCESSED_TABLE_COLUMNS = [
  {
    newFormatter: { type: 'link', config: { getUrl: row => `${URL.BPMN_ADMIN_PROCESS}?recordRef=${row.id}` } },
    text: getMLValue({
      ru: 'ID Процесса',
      en: 'Process ID'
    }),
    attribute: 'key',
    dataField: 'key'
  },
  {
    text: getMLValue({
      ru: 'Описание процесса',
      en: 'Process definition'
    }),
    attribute: 'ecosDef',
    dataField: 'ecosDef'
  },
  {
    text: getMLValue({
      ru: 'Количество инцидентов',
      en: 'Incident count'
    }),
    attribute: 'incidentCount',
    dataField: 'incidentCount'
  },
  {
    text: getMLValue({
      ru: 'Количество запущенных экземпляров',
      en: 'Running process count'
    }),
    attribute: 'instancesCount',
    dataField: 'instancesCount'
  },
  {
    classes: 'common-table-column__small',
    newFormatter: { type: 'component', config: { Component: BpmnProcessStatusColumn } },
    text: getMLValue({
      ru: 'Состояние',
      en: 'State'
    }),
    attribute: 'key',
    dataField: 'key'
  }
];
