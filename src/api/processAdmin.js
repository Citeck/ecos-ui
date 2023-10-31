import Records from '../components/Records';
import { PREDICATE_AND, PREDICATE_EQ } from '../components/Records/predicates/predicates';
import { PROCESS_TABS_TYPES } from '../constants/processAdmin';

export class ProcessAdminApi {
  getMetaInfo = processId => {
    return Records.get(processId).load({
      id: '?id',
      key: 'key',
      version: 'ecosDefRev.version?num',
      innerVersion: 'version?num',
      modified: 'ecosDefRev._modified',
      modifier: 'ecosDefRev._modifier',
      deploymentId: 'deploymentId',
      definitionRef: 'ecosDefRev.processDefRef',
      definitionRefId: 'ecosDefRev.processDefRef?id',
      allRunningInstancesCount: 'overallStatistics.instancesCount?num',
      statistics: 'statistics{incidentCount:incidentsCount?num,instancesCount:instancesCount?num}',
      activityStatistics: 'activityStatistics[]?json',
      bpmnDefinition: 'ecosDefRev.definition'
    });
  };

  getProcessVersions = processKey => {
    return Records.query(
      {
        sourceId: 'eproc/bpmn-def-engine',
        query: {
          t: PREDICATE_AND,
          val: [
            {
              t: PREDICATE_EQ,
              att: 'onlyLatestVersion',
              val: false
            },
            {
              t: PREDICATE_EQ,
              att: 'key',
              val: processKey
            }
          ]
        },
        page: { maxItems: 10000 },
        sortBy: [
          {
            ascending: false,
            attribute: 'version'
          }
        ]
      },
      {
        key: 'key',
        disp: '?disp',
        version: 'ecosDefRev.version?num',
        innerVersion: 'version?num',
        ecosDef: 'ecosDefRev.processDefRef',
        bpmnDefinition: 'ecosDefRev.definition',
        statistics: 'statistics{incidentCount:incidentsCount?num,instancesCount:instancesCount?num}',
        overallStatistics: 'overallStatistics{incidentCount:incidentsCount?num,instancesCount:instancesCount?num}'
      }
    );
  };

  getJournalTabInfo = ({ tabId, ...args }) => {
    switch (tabId) {
      case PROCESS_TABS_TYPES.INSTANCES:
        return this.getProcessInstances(args);
      case PROCESS_TABS_TYPES.INCIDENTS:
        return this.getProcessIncidents(args);
      case PROCESS_TABS_TYPES.JOB_DEFINITIONS:
        return this.getProcessJobDefs(args);
      default:
        break;
    }
  };

  getProcessInstances = ({ page, sortBy, filters = [], processId }) => {
    return Records.query(
      {
        sourceId: 'eproc/bpmn-proc',
        query: {
          t: PREDICATE_AND,
          val: [
            {
              att: 'bpmnDefEngine',
              t: PREDICATE_EQ,
              val: processId
            },
            ...filters
          ]
        },
        page,
        sortBy
      },
      {
        id: '?id',
        dispId: 'id',
        disp: '?disp',
        isSuspended: 'isSuspended?bool',
        document: 'documentRef',
        documentId: 'documentRef?id',
        documentJournalId: 'documentRef._type.journalRef?id',
        startTime: 'startTime',
        incidents: 'incidents[]{?id}'
      }
    );
  };

  getProcessIncidents = ({ page, sortBy, filters = [], processId }) => {
    return Records.query(
      {
        sourceId: 'eproc/bpmn-incident',
        query: {
          t: PREDICATE_AND,
          val: [
            {
              att: 'bpmnDefEngine',
              t: PREDICATE_EQ,
              val: processId
            },
            ...filters
          ]
        },
        page,
        sortBy
      },
      {
        id: '?id',
        dispId: 'id',
        message: 'message',
        stackTrace: 'causeRef.stackTrace',
        causeRefId: 'causeRef.?id',
        processInstance: 'processInstance.id',
        created: '_created',
        activityId: 'activityId',
        failedActivityId: 'failedActivityId',
        incidentType: 'incidentType',
        note: 'note'
      }
    );
  };

  getProcessJobDefs = ({ page, sortBy, filters = [], processId }) => {
    return Records.query(
      {
        sourceId: 'eproc/bpmn-job-def',
        query: {
          t: PREDICATE_AND,
          val: [
            {
              att: 'bpmnDefEngine',
              t: PREDICATE_EQ,
              val: processId
            },
            ...filters
          ]
        },
        page,
        sortBy
      },
      {
        id: '?id',
        state: 'state',
        activityId: 'activityId',
        type: 'type',
        configuration: 'configuration'
      }
    );
  };
}
