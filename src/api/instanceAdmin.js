import Records from '../components/Records';
import { PREDICATE_AND, PREDICATE_EQ } from '../components/Records/predicates/predicates';
import { INSTANCE_TABS_TYPES } from '../constants/instanceAdmin';

export class InstanceAdminApi {
  getMetaInfo = instanceId => {
    return Records.get(instanceId).load({
      id: 'id',
      document: 'documentRef',
      documentId: 'documentRef?id',
      ecosDefRev: 'ecosDefRev',
      definitionRef: 'ecosDefRev.processDefRef',
      definitionRefId: 'ecosDefRev.processDefRef?id',
      version: 'ecosDefRev.version?num',
      startTime: 'startTime',
      isSuspended: 'isSuspended?bool',
      bpmnDefinition: 'ecosDefRev.definition',
      bpmnDefEngine: 'bpmnDefEngine?id',
      activityStatistics: 'activityStatistics[]?json'
    });
  };

  getJournalTabInfo = ({ tabId, ...args }) => {
    switch (tabId) {
      case INSTANCE_TABS_TYPES.VARIABLES:
        return this.getInstanceVariables(args);
      case INSTANCE_TABS_TYPES.INCIDENTS:
        return this.getInstanceIncidents(args);
      case INSTANCE_TABS_TYPES.CALLED_PROCESS:
        return this.getInstanceCalledProcesses(args);
      case INSTANCE_TABS_TYPES.JOB_DEFINITIONS:
        return this.getInstanceJobDefinitions(args);
      case INSTANCE_TABS_TYPES.EXTERNAL_TASKS:
        return this.getInstanceExternalTasks(args);
      default:
        break;
    }
  };

  getInstanceVariables = ({ page, sortBy, filters = [], instanceId }) => {
    return Records.query(
      {
        sourceId: 'eproc/bpmn-variable-instance',
        query: {
          t: PREDICATE_AND,
          val: [
            {
              att: 'processInstance',
              t: PREDICATE_EQ,
              val: instanceId
            },
            ...filters
          ]
        },
        page,
        sortBy
      },
      {
        name: 'name',
        type: 'type',
        value: 'value',
        typedValueInfo: 'typedValueInfo?json',
        serializableValue: 'serializableValue?json',
        scope: 'scope{disp:?disp,id:?id,activityId}'
      }
    );
  };

  getInstanceIncidents = async ({ page, sortBy, filters = [], instanceId }) => {
    return Records.query(
      {
        sourceId: 'eproc/bpmn-incident',
        query: {
          t: PREDICATE_AND,
          val: [
            {
              att: 'bpmnProcess',
              t: PREDICATE_EQ,
              val: instanceId
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
        processInstanceRef: 'processInstance?id',
        created: '_created',
        activityId: 'activityId',
        failedActivityId: 'failedActivityId',
        incidentType: 'incidentType',
        note: 'note'
      }
    );
  };

  getInstanceCalledProcesses = async ({ sortBy, filters = [], instanceId }) => {
    return Records.query(
      {
        sourceId: 'eproc/bpmn-called-process-instance',
        query: {
          t: PREDICATE_AND,
          val: [
            {
              att: 'bpmnProcess',
              t: PREDICATE_EQ,
              val: instanceId
            },
            ...filters
          ]
        },
        page: {
          maxItems: 10000
        },
        sortBy
      },
      {
        id: '?id',
        dispId: 'id',
        isSuspended: 'isSuspended?bool',
        incidents: 'incidents[]{?id}',
        calledProcess: 'calledProcess{disp:id,id:?id}',
        calledProcessDisp: 'calledProcess.id',
        bpmnDefEngine: 'bpmnDefEngine{disp:?disp,id:?id}',
        bpmnDefEngineDisp: 'bpmnDefEngine?disp',
        callActivityId: 'callActivityId'
      }
    );
  };

  getInstanceJobDefinitions = async ({ page, sortBy, filters = [], instanceId }) => {
    return Records.query(
      {
        sourceId: 'eproc/bpmn-job',
        query: {
          t: PREDICATE_AND,
          val: [
            {
              att: 'bpmnProcess',
              t: PREDICATE_EQ,
              val: instanceId
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
        state: 'state{.disp, suspended?bool}',
        created: '_created',
        dueDate: 'dueDate',
        retries: 'retries?num',
        activityId: 'jobDefinition.activityId',
        failedActivityId: 'failedActivityId',
        configuration: 'jobDefinition.configuration'
      }
    );
  };

  getInstanceExternalTasks = async ({ page, sortBy, filters = [], instanceId }) => {
    return Records.query(
      {
        sourceId: 'eproc/bpmn-external-task',
        query: {
          t: PREDICATE_AND,
          val: [
            {
              att: 'bpmnProcess',
              t: PREDICATE_EQ,
              val: instanceId
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
        activityId: 'activityId',
        retries: 'retries?num',
        workerId: 'workerId',
        lockExpirationTime: 'lockExpirationTime',
        topic: 'topic',
        priority: 'priority?num'
      }
    );
  };

  deleteInstance = ({ instanceId, skipCustomListener, skipIoMapping }) => {
    const instanceRecord = Records.get(instanceId);

    instanceRecord.att('action', 'DELETE');
    instanceRecord.att('skipCustomListener', skipCustomListener);
    instanceRecord.att('skipIoMapping', skipIoMapping);

    return instanceRecord.save();
  };

  suspendInstance = instanceId => {
    const instanceRecord = Records.get(instanceId);

    instanceRecord.att('action', 'SUSPEND');

    return instanceRecord.save();
  };

  activateInstance = instanceId => {
    const instanceRecord = Records.get(instanceId);

    instanceRecord.att('action', 'ACTIVATE');

    return instanceRecord.save();
  };
}
