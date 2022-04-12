import Records from '../components/Records';

// @todo actually its not only a cmmn api. Its bpmn-def + cmmn-def
export default class CmmnApi {
  getDefinition = record => {
    return Records.get(record).load('definition?str', true);
  };

  saveDefinition = (record, xml, img, action) => {
    const rec = Records.get(record);

    rec.att('definition?str', xml);
    rec.att('image?str', img);

    if (!!action) {
      rec.att('action', action);
    }

    return rec.save();
  };

  saveDefinitionAndDeploy = (record, xml, img) => {
    const rec = Records.get(record);

    rec.att('definition?str', xml);
    rec.att('image?str', img);
    rec.att('action', 'DEPLOY');

    return rec.save();
  };

  saveRecordData = (record, data) => {
    const rec = Records.get(record);

    Object.keys(data).forEach(key => {
      rec.att(key, data[key]);
    });

    return rec.save();
  };
}
