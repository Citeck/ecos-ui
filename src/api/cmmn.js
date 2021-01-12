import Records from '../components/Records';

export default class CmmnApi {
  getDefinition = record => {
    return Records.get(record).load('definition?str');
  };

  saveDefinition = (record, xml, img) => {
    const rec = Records.get(record);

    rec.att('definition?str', xml);
    rec.att('image?str', img);

    return rec.save();
  };
}
