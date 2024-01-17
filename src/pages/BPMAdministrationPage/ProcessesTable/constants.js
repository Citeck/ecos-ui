import { BpmnProcessStatusColumn } from '../../../components/BpmnProcessStatusColumn';
import { URL } from '../../../constants';
import { createDocumentUrl } from '../../../helpers/urls';
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
    newFormatter: { type: 'link', config: { getUrl: row => createDocumentUrl(row.ecosDefId) } },
    text: getMLValue({
      ru: 'Описание процесса',
      en: 'Process definition'
    }),
    attribute: 'ecosDef',
    dataField: 'ecosDef'
  },
  {
    text: getMLValue({
      ru: 'Инциденты',
      en: 'Incidents'
    }),
    attribute: 'incidentCount',
    dataField: 'incidentCount'
  },
  {
    text: getMLValue({
      ru: 'Запущенные экземпляры',
      en: 'Running process'
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
