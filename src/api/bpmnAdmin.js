import Records from '../components/Records';
import { PREDICATE_AND, PREDICATE_EQ } from '../components/Records/predicates/predicates';

export class BpmnAdminApi {
  getProcesses = ({ page, filterPredicate = {}, sortBy, allVersions = false } = {}) => {
    return Records.query(
      {
        sourceId: 'eproc/bpmn-def-engine',
        query: {
          t: PREDICATE_AND,
          val: [
            {
              t: PREDICATE_EQ,
              att: 'onlyLatestVersion',
              val: !allVersions
            },
            filterPredicate
          ]
        },
        page,
        sortBy
      },
      {
        key: 'key',
        disp: '?disp',
        version: 'ecosDefRev.version?num',
        innerVersion: 'version?num',
        ecosDef: 'ecosDefRev.processDefRef',
        ecosDefId: 'ecosDefRev.processDefRef?id',
        overallStatistics: 'overallStatistics{incidentCount:incidentsCount?num,instancesCount:instancesCount?num}'
      }
    );
  };
}
