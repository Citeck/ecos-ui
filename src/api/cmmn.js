import Records from '../components/Records';
import { SourcesId } from '../constants';

// @todo actually its not only a cmmn api. Its bpmn-def + cmmn-def
export default class CmmnApi {
  getDefinition = record => {
    return Records.get(record).load('definition?str', true);
  };

  saveDefinition = (record, xml, img, deploy) => {
    const rec = Records.get(record);

    rec.att('definition?str', xml);
    rec.att('image?str', img);
    if (deploy) {
      rec.att('action', 'DEPLOY');
    }

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
}
