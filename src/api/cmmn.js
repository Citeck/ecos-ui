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
    return Records.get(procDef).load('cm:content');
  };

  getHeatmapData = procDef => {
    return Records.query(
      {
        sourceId: SourcesId.BPMN_STAT,
        language: 'predicate-with-data',
        query: {
          data: { procDef },
          predicate: {}
        }
      },
      ['activeCount', 'name', 'completedCount', 'id']
    );
  };
}
