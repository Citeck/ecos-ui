import Records from '../components/Records';
import { CommonApi } from './common';

export class UserConfigApi extends CommonApi {
  saveConfig = ({ data }) => {
    const rec = Records.get('uiserv/user-conf@');

    rec.att('data', { ...data });
    rec.save().then(rec => rec.id);
  };

  getSavedConfig = ({ id }) => {
    if (id) {
      return Records.get(`uiserv/user-conf@${id}`)
        .load('data?json')
        .then(res => res);
    }
  };
}
