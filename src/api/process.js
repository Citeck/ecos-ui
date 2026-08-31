import { SourcesId } from '@citeck/constants';
import { PERMISSION_DEPLOY_PROCESS } from '@citeck/constants/bpmn';
import { PERMISSION_DMN_DEPLOY_PROCESS } from '@citeck/constants/dmn';
import Records from '@citeck/records-core';

import ecosFetch from '../helpers/ecosFetch';

export const PROCESS_DEF_API_ACTIONS = {
  DRAFT: 'DRAFT',
  SAVE: 'SAVE',
  DEPLOY: 'DEPLOY'
};

const BPMN_AUTO_LAYOUT_URL = '/gateway/eproc/api/bpmn/auto-layout/transform';

export class ProcessApi {
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

  applyAutoLayout = xml => {
    return ecosFetch(BPMN_AUTO_LAYOUT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ definition: xml })
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
      })
      .then(({ success, definition, message }) => {
        if (!success) {
          throw new Error(message || 'Auto-layout failed');
        }
        return definition;
      });
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

  _heatmapRequests = new Map();

  getHeatmapData = (procDef, predicates = []) => {
    const requestKey = JSON.stringify([procDef, predicates]);
    const inFlight = this._heatmapRequests.get(requestKey);

    if (inFlight) {
      return inFlight;
    }

    // count(*) aggregation over bpmn-process-elements is expensive on large processes,
    // so one query per side; the group count is bounded by the number of schema elements
    const BPMN_STAT_PAGE_LIMIT = 10000;

    const query = completed => ({
      sourceId: SourcesId.BPMN_STAT,
      language: 'predicate',
      page: {
        maxItems: BPMN_STAT_PAGE_LIMIT
      },
      query: {
        t: 'and',
        v: [{ t: 'eq', a: 'procDefRef', v: procDef }, { t: completed ? 'not-empty' : 'empty', a: 'completed' }, ...predicates]
      },
      groupBy: ['elementDefId']
    });

    const queryCounts = completed =>
      Records.query(query(completed), {
        id: 'elementDefId',
        [completed ? 'completedCount' : 'activeCount']: 'count(*)?num'
      });

    const request = Promise.all([queryCounts(true), queryCounts(false)])
      .then(([completedCount, activeCount]) => {
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
      })
      .finally(() => {
        this._heatmapRequests.delete(requestKey);
      });

    this._heatmapRequests.set(requestKey, request);

    return request;
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
            },
            {
              att: 'kpiSettingsRef.kpiType',
              t: 'eq',
              val: 'DURATION'
            }
          ]
        },
        groupBy: ['kpiSettingsRef.kpiAsNumber&targetBpmnActivityId&kpiSettingsRef']
      },
      {
        kpiRef: 'kpiSettingsRef{disp:?disp,value:?assoc}',
        kpi: 'kpiSettingsRef.kpiAsNumber?num|fmt(0.00)',
        displayKpiOnBpmnActivityId: 'kpiSettingsRef.displayKpiOnBpmnActivityId',
        kpiType: 'kpiSettingsRef.kpiType',
        kpiValue: 'avg(value)?num|fmt(0.00)',
        kpiDeviation: '(avg(value) / kpiSettingsRef.kpiAsNumber * 100 - 100)?num|fmt(0.00)'
      }
    ).then(resp => resp.records);
  };
}
