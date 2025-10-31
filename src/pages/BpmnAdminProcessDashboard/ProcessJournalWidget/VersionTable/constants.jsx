import React from 'react';

import { BpmnProcessStatusColumn } from '../../../../components/BpmnProcessStatusColumn';
import { createDocumentUrl } from '../../../../helpers/urls';
import { URL } from '../../../../constants';
import { ActivityComponent, MessageComponent } from '../components';
import { FailedActivityComponent } from '../components/FailedActivityComponent';
import { NoteComponent } from '../components/NoteComponent';
import { RetryFailedJob } from '../components/RetryFailedJob';
import { PROCESS_TABS_TYPES } from '../../../../constants/processAdmin';
import { getMLValue } from '../../../../helpers/util';

export const getTableColumns = (tabId, args) => {
  switch (tabId) {
    case PROCESS_TABS_TYPES.INSTANCES:
      return getInstancesTableColumns(args);
    case PROCESS_TABS_TYPES.INCIDENTS:
      return getIncidentsTableColumns(args);
    case PROCESS_TABS_TYPES.JOB_DEFINITIONS:
      return getProcessJobDefs(args);
    default:
      return [];
  }
};

export const getInstancesTableColumns = ({ documentJournalId }) => [
  {
    newFormatter: { type: 'link', config: { getUrl: row => `${URL.BPMN_ADMIN_INSTANCE}?recordRef=${row.id}` } },
    text: getMLValue({
      ru: 'ID',
      en: 'ID'
    }),
    attribute: 'id',
    dataField: 'dispId'
  },
  {
    newFormatter: { type: 'link', config: { getUrl: row => createDocumentUrl(row.documentId) } },
    newEditor: { type: 'journal', config: { journalId: documentJournalId, multiple: false } },
    searchable: true,
    searchableByText: true,
    disableSelect: !documentJournalId,
    text: getMLValue({
      ru: 'Документ',
      en: 'Document'
    }),
    attribute: 'document',
    dataField: 'document'
  },
  {
    newFormatter: { type: 'date', config: { format: 'LLL' } },
    sortable: true,
    text: getMLValue({
      ru: 'Время старта',
      en: 'Start time'
    }),
    attribute: 'startTime',
    dataField: 'startTime'
  },
  {
    classes: 'common-table-column__small',
    newFormatter: { type: 'component', config: { Component: BpmnProcessStatusColumn } },
    text: getMLValue({
      ru: 'Состояние',
      en: 'State'
    }),
    attribute: 'id',
    dataField: 'dispId'
  }
];

export const getIncidentsTableColumns = ({ tabId }) => [
  {
    newFormatter: { type: 'component', config: { Component: MessageComponent } },
    newEditor: { type: 'text', config: {} },
    text: getMLValue({
      ru: 'Сообщение',
      en: 'Message'
    }),
    searchable: true,
    searchableByText: true,
    attribute: 'message',
    dataField: 'message'
  },
  {
    newFormatter: { type: 'link', config: { getUrl: row => `${URL.BPMN_ADMIN_INSTANCE}?recordRef=${row.processInstance}` } },
    text: getMLValue({
      ru: 'Экземпляр процесса',
      en: 'Process instance'
    }),
    sortable: true,
    attribute: 'processInstanceRef',
    dataField: 'processInstanceRef'
  },
  {
    newFormatter: { type: 'date', config: { format: 'LLL' } },
    sortable: true,
    text: getMLValue({
      ru: 'Дата создания',
      en: 'Created'
    }),
    attribute: 'created',
    dataField: 'created'
  },
  {
    newFormatter: { type: 'component', config: { Component: ActivityComponent } },
    sortable: true,
    text: getMLValue({
      ru: 'Элемент',
      en: 'Element'
    }),
    attribute: 'activityId',
    dataField: 'activityId'
  },
  {
    newFormatter: { type: 'component', config: { Component: FailedActivityComponent } },
    text: getMLValue({
      ru: 'Отказавший элемент',
      en: 'Failed element'
    }),
    attribute: 'failedActivityId',
    dataField: 'failedActivityId'
  },
  {
    sortable: true,
    text: getMLValue({
      ru: 'Тип',
      en: 'Type'
    }),
    attribute: 'incidentType',
    dataField: 'incidentType'
  },
  {
    classes: 'common-table-column__small',
    newFormatter: { type: 'component', config: { Component: NoteComponent } },
    text: getMLValue({
      ru: 'Примечание',
      en: 'Note'
    }),
    attribute: 'note',
    dataField: 'note'
  },
  {
    classes: 'common-table-column__small',
    newFormatter: { type: 'component', config: { Component: ({ row }) => <RetryFailedJob row={row} tabId={tabId} /> } },
    text: getMLValue({
      ru: 'Действия',
      en: 'Actions'
    }),
    attribute: 'id',
    dataField: 'id'
  }
];

export const getProcessJobDefs = () => [
  {
    text: getMLValue({
      ru: 'Состояние',
      en: 'State'
    }),
    attribute: 'state',
    dataField: 'state'
  },
  {
    newFormatter: { type: 'component', config: { Component: ActivityComponent } },
    text: getMLValue({
      ru: 'Элемент',
      en: 'Element'
    }),
    attribute: 'activityId',
    dataField: 'activityId'
  },
  {
    text: getMLValue({
      ru: 'Тип',
      en: 'Type'
    }),
    attribute: 'type',
    dataField: 'type'
  },
  {
    text: getMLValue({
      ru: 'Конфигурация',
      en: 'Configuration'
    }),
    attribute: 'configuration',
    dataField: 'configuration'
  }
];
