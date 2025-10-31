import React from 'react';

import { INSTANCE_TABS_TYPES } from '../../../constants/instanceAdmin';
import { getMLValue, t } from '../../../helpers/util';
import { ActivityElementColumn, JobActionColumn, ScopeColumn, ValueColumn, RetryJobColumn, VariableActionColumn } from './components';
import { MessageComponent } from '../../BpmnAdminProcessDashboard/ProcessJournalWidget/components';
import { BpmnProcessStatusColumn } from '../../../components/BpmnProcessStatusColumn';
import { NoteComponent } from '../../BpmnAdminProcessDashboard/ProcessJournalWidget/components/NoteComponent';
import { URL } from '../../../constants';
import { PREDICATE_EQ } from '../../../components/Records/predicates/predicates';

export const getTableColumns = (tabId, args) => {
  switch (tabId) {
    case INSTANCE_TABS_TYPES.VARIABLES:
      return getVariableColumns(args);
    case INSTANCE_TABS_TYPES.INCIDENTS:
      return getIncidentsColumns(args);
    case INSTANCE_TABS_TYPES.CALLED_PROCESS:
      return getCalledProcessesColumns(args);
    case INSTANCE_TABS_TYPES.JOB_DEFINITIONS:
      return getJobDefinitionsColumns(args);
    case INSTANCE_TABS_TYPES.EXTERNAL_TASKS:
      return getExternalTasksColumns(args);
    default:
      return [];
  }
};

export const getVariableColumns = ({ instanceId, tabId }) => [
  {
    searchable: true,
    searchableByText: true,
    sortable: true,
    newEditor: { type: 'text', config: {} },
    text: getMLValue({
      ru: 'Имя переменной',
      en: 'Name'
    }),
    attribute: 'name',
    dataField: 'name'
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
    newFormatter: {
      type: 'component',
      config: { Component: ({ row }) => <ValueColumn row={row} instanceId={instanceId} tabId={tabId} /> }
    },
    text: getMLValue({
      ru: 'Значение',
      en: 'Value'
    }),
    attribute: 'value',
    dataField: 'value'
  },
  {
    searchable: true,
    searchableByText: true,
    disableSelect: true,
    newEditor: { type: 'journal', config: { journalId: 'bpmn-process-def', multiple: false } },
    newFormatter: {
      type: 'component',
      config: { Component: ({ row }) => <ScopeColumn row={row} instanceId={instanceId} tabId={tabId} /> }
    },
    text: getMLValue({
      ru: 'Область видимости',
      en: 'Scope'
    }),
    attribute: 'scope',
    dataField: 'scope'
  },
  {
    classes: 'common-table-column__small',
    newFormatter: {
      type: 'component',
      config: { Component: ({ row }) => <VariableActionColumn row={row} instanceId={instanceId} tabId={tabId} /> }
    },
    text: getMLValue({
      ru: 'Действия',
      en: 'Actions'
    }),
    attribute: 'id',
    dataField: 'id'
  }
];

export const getIncidentsColumns = ({ instanceId, tabId }) => [
  {
    searchable: true,
    searchableByText: true,
    newEditor: { type: 'text', config: {} },
    newFormatter: { type: 'component', config: { Component: MessageComponent } },
    text: getMLValue({
      ru: 'Сообщение',
      en: 'Message'
    }),
    attribute: 'message',
    dataField: 'message'
  },
  {
    newFormatter: { type: 'link', config: { getUrl: row => `${URL.BPMN_ADMIN_INSTANCE}?recordRef=${row.processInstanceRef}` } },
    newEditor: { type: 'text', config: {} },
    text: getMLValue({
      ru: 'Экземпляр процесса',
      en: 'Process instance'
    }),
    attribute: 'processInstance',
    dataField: 'processInstance'
  },
  {
    newFormatter: { type: 'date', config: { format: 'LLL' } },
    text: getMLValue({
      ru: 'Дата создания',
      en: 'Created'
    }),
    attribute: 'created',
    dataField: 'created'
  },
  {
    newFormatter: { type: 'component', config: { Component: ({ row }) => <ActivityElementColumn row={row} instanceId={instanceId} /> } },
    text: getMLValue({
      ru: 'Элемент',
      en: 'Element'
    }),
    attribute: 'activityId',
    dataField: 'activityId'
  },
  {
    newFormatter: {
      type: 'component',
      config: { Component: ({ row }) => <ActivityElementColumn row={row} instanceId={instanceId} nameField="failedActivityId" /> }
    },
    text: getMLValue({
      ru: 'Отказавший элемент',
      en: 'Failed element'
    }),
    attribute: 'activityId',
    dataField: 'activityId'
  },
  {
    text: getMLValue({
      ru: 'Тип',
      en: 'Type'
    }),
    attribute: 'incidentType',
    dataField: 'incidentType'
  },
  {
    newFormatter: { type: 'component', config: { Component: NoteComponent } },
    text: getMLValue({
      ru: 'Примечание',
      en: 'Note'
    }),
    attribute: 'note',
    dataField: 'note'
  },
  {
    newFormatter: {
      type: 'component',
      config: { Component: ({ row }) => <RetryJobColumn row={row} tabId={tabId} instanceId={instanceId} /> }
    },
    text: getMLValue({
      ru: 'Действия',
      en: 'Actions'
    }),
    attribute: 'id',
    dataField: 'id'
  }
];

export const getCalledProcessesColumns = ({ instanceId }) => [
  {
    newFormatter: { type: 'link', config: { getUrl: row => `${URL.BPMN_ADMIN_INSTANCE}?recordRef=${row.calledProcess.id}` } },
    text: getMLValue({
      ru: 'Вызываемый экземпляр',
      en: 'Called instance'
    }),
    attribute: 'calledProcessDisp',
    dataField: 'calledProcessDisp'
  },
  {
    newFormatter: { type: 'link', config: { getUrl: row => `${URL.BPMN_ADMIN_PROCESS}?recordRef=${row.bpmnDefEngine.id}` } },
    text: getMLValue({
      ru: 'Описание процесса',
      en: 'Process definition'
    }),
    attribute: 'bpmnDefEngineDisp',
    dataField: 'bpmnDefEngineDisp'
  },
  {
    newFormatter: {
      type: 'component',
      config: { Component: ({ row }) => <ActivityElementColumn row={row} instanceId={instanceId} nameField="callActivityId" /> }
    },
    text: getMLValue({
      ru: 'Элемент',
      en: 'Element'
    }),
    attribute: 'callActivityId',
    dataField: 'callActivityId'
  },
  {
    newFormatter: { type: 'component', config: { Component: BpmnProcessStatusColumn } },
    text: getMLValue({
      ru: 'Состояние',
      en: 'State'
    }),
    attribute: 'id',
    dataField: 'id'
  }
];

export const getJobDefinitionsColumns = ({ instanceId }) => [
  {
    sortable: true,
    text: getMLValue({
      ru: 'ID',
      en: 'ID'
    }),
    attribute: 'id',
    dataField: 'dispId'
  },
  {
    newFormatter: { type: 'date', config: { format: 'LLL' } },
    text: getMLValue({
      ru: 'Дата создания',
      en: 'Created'
    }),
    attribute: 'created',
    dataField: 'created'
  },
  {
    sortable: true,
    newFormatter: { type: 'date', config: { format: 'LLL' } },
    text: getMLValue({
      ru: 'Срок выполнения',
      en: 'Due date'
    }),
    attribute: 'dueDate',
    dataField: 'dueDate'
  },
  {
    sortable: true,
    text: getMLValue({
      ru: 'Попытки',
      en: 'Retries'
    }),
    attribute: 'retries',
    dataField: 'retries'
  },
  {
    newFormatter: { type: 'component', config: { Component: ({ row }) => <ActivityElementColumn row={row} instanceId={instanceId} /> } },
    text: getMLValue({
      ru: 'Элемент',
      en: 'Element'
    }),
    attribute: 'activityId',
    dataField: 'activityId'
  },
  {
    newFormatter: {
      type: 'component',
      config: { Component: ({ row }) => <ActivityElementColumn row={row} instanceId={instanceId} nameField="failedActivityId" /> }
    },
    text: getMLValue({
      ru: 'Отказавший элемент',
      en: 'Failed element'
    }),
    attribute: 'failedActivityId',
    dataField: 'failedActivityId'
  },
  {
    text: getMLValue({
      ru: 'Конфигурация',
      en: 'Configuration'
    }),
    attribute: 'configuration',
    dataField: 'configuration'
  },
  {
    newFormatter: { type: 'component', config: { Component: JobActionColumn } },
    text: getMLValue({
      ru: 'Действия',
      en: 'Actions'
    }),
    attribute: 'id',
    dataField: 'id'
  }
];

export const getExternalTasksColumns = ({ instanceId }) => [
  {
    searchable: true,
    searchableByText: true,
    predicates: [{ value: PREDICATE_EQ, label: t('predicate.eq'), needValue: true }],
    newEditor: { type: 'text', config: {} },
    sortable: true,
    text: getMLValue({
      ru: 'ID',
      en: 'ID'
    }),
    attribute: 'id',
    dataField: 'dispId'
  },
  {
    searchable: true,
    searchableByText: true,
    predicates: [{ value: PREDICATE_EQ, label: t('predicate.eq'), needValue: true }],
    newEditor: { type: 'text', config: {} },
    newFormatter: { type: 'component', config: { Component: ({ row }) => <ActivityElementColumn row={row} instanceId={instanceId} /> } },
    text: getMLValue({
      ru: 'Элемент',
      en: 'Element'
    }),
    attribute: 'activityId',
    dataField: 'activityId'
  },
  {
    text: getMLValue({
      ru: 'Попытки',
      en: 'Retries'
    }),
    attribute: 'retries',
    dataField: 'retries'
  },
  {
    searchable: true,
    searchableByText: true,
    predicates: [{ value: PREDICATE_EQ, label: t('predicate.eq'), needValue: true }],
    newEditor: { type: 'text', config: {} },
    text: getMLValue({
      ru: 'ID обработчика',
      en: "Handler's ID"
    }),
    attribute: 'workerId',
    dataField: 'workerId'
  },
  {
    newFormatter: { type: 'date', config: { format: 'LLL' } },
    text: getMLValue({
      ru: 'Срок блокировки',
      en: 'Expiration time'
    }),
    attribute: 'lockExpirationTime',
    dataField: 'lockExpirationTime'
  },
  {
    searchable: true,
    searchableByText: true,
    predicates: [{ value: PREDICATE_EQ, label: t('predicate.eq'), needValue: true }],
    newEditor: { type: 'text', config: {} },
    text: getMLValue({
      ru: 'Топик',
      en: 'Topic'
    }),
    attribute: 'topicName',
    dataField: 'topic'
  },
  {
    sortable: true,
    text: getMLValue({
      ru: 'Приоритет',
      en: 'Priority'
    }),
    attribute: 'priority',
    dataField: 'priority'
  }
];
