import { NotificationManager } from 'react-notifications';
import copy from 'copy-to-clipboard';

import { CommonApi } from './common';
import Records from '../components/Records';
import { t } from '../helpers/util';

export class UserConfigApi extends CommonApi {
  saveConfig = ({ data }) => {
    const rec = Records.get('uiserv/user-conf@');

    rec.att('data?json', data);

    return rec.save().then(rec => rec);
  };

  getConfig = ({ id }) => {
    if (id) {
      return Records.get(`uiserv/user-conf@${id}`)
        .load('data?json')
        .then(res => res);
    }
  };

  copyUrlConfig = ({ data, url }) => {
    NotificationManager.info('', t('export-component.notice.buffer-link-preparation'), 3000);

    this.saveConfig({ data })
      .then(response => {
        if (response && response.id && copy(`${url}&userConfigId=${response.id}`)) {
          NotificationManager.success('', t('export-component.notice.buffer-link-done'), 3000);
        } else {
          NotificationManager.warning('', t('export-component.notice.buffer-link-done'), 3000);
        }
      })
      .catch(e => {
        console.error(e);
        NotificationManager.error('', t('export-component.notice.buffer-link-done'), 3000);
      });
  };
}
