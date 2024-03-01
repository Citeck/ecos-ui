import Records from '../components/Records';
import { SourcesId } from '../constants';
import { PERMISSION_DEPLOY_PROCESS } from '../constants/bpmn';
import { PERMISSION_DMN_DEPLOY_PROCESS } from '../constants/dmn';

export const PROCESS_DEF_API_ACTIONS = {
  DRAFT: 'DRAFT',
  SAVE: 'SAVE',
  DEPLOY: 'DEPLOY'
};

export default class ProcessApi {
  getDefinition = record => {
    return Records.get(record).load('definition?str', true);
  };

  getHasDeployRights = (record, isDMN = false) => {
    if (isDMN) {
      return Records.get(record).load(PERMISSION_DMN_DEPLOY_PROCESS, true);
    }

    return Records.get(record).load(PERMISSION_DEPLOY_PROCESS, true);
  };

  getSectionPath = record => {
    return Records.get(record).load("sectionPath[]{code}|join('-')", true);
  };

  saveDefinition = (record, xml, img, definitionAction) => {
    const rec = Records.get(record);

    rec.att('definition?str', xml);
    rec.att('image?str', img);
    rec.att('action', definitionAction);

    return rec.save();
  };

  saveRecordData = (record, data) => {
    const rec = Records.get(record);

    Object.keys(data).forEach(key => {
      rec.att(key, data[key]);
    });

    return rec.save();
  };

  getModel = procDef => {
    return Records.get(procDef).load('definition');
  };

  getHeatmapData = (procDef, predicates = []) => {
    const query = completed => ({
      sourceId: SourcesId.BPMN_STAT,
      language: 'predicate',
      query: {
        t: 'and',
        v: [{ t: 'eq', a: 'procDefRef', v: procDef }, { t: completed ? 'not-empty' : 'empty', a: 'completed' }, ...predicates]
      },
      groupBy: ['elementDefId']
    });

    const promiseCompleted = Records.query(query(true), { id: 'elementDefId', completedCount: 'count(*)?num' });
    const promiseActive = Records.query(query(false), { id: 'elementDefId', activeCount: 'count(*)?num' });

    return Promise.all([promiseCompleted, promiseActive]).then(([completedCount, activeCount]) => {
      const mergedRecords = [...completedCount.records];

      activeCount.records.forEach(rec => {
        const foundI = completedCount.records.findIndex(r => r.id === rec.id);

        if (foundI === -1) {
          mergedRecords.push(rec);
        } else {
          mergedRecords[foundI] = { ...rec, ...mergedRecords[foundI] };
        }
      });

      return mergedRecords;
    });
  };

  getKPIData = async recordRef => {
    return Records.query(
      {
        sourceId: SourcesId.BPMN_KPI,
        language: 'predicate',
        query: {
          t: 'and',
          val: [
            {
              t: 'eq',
              att: '_type',
              val: 'emodel/type@bpmn-kpi-value'
            },
            {
              att: 'procDefRef',
              t: 'contains',
              val: [recordRef]
            }
          ]
        },
        groupBy: ['kpiSettingsRef.kpiAsNumber&targetBpmnActivityId&kpiSettingsRef']
      },
      {
        kpiRef: 'kpiSettingsRef{disp:?disp,value:?assoc}',
        kpi: 'kpiSettingsRef.kpiAsNumber?num|fmt(0.00)',
        displayKpiOnBpmnActivityId: 'kpiSettingsRef.displayKpiOnBpmnActivityId',
        kpiValue: 'avg(value)?num|fmt(0.00)',
        kpiDeviation: '(avg(value) / kpiSettingsRef.kpiAsNumber * 100 - 100)?num|fmt(0.00)'
      }
    ).then(resp => resp.records);
  };
}
