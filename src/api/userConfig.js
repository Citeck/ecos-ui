import { NotificationManager } from 'react-notifications';
import get from 'lodash/get';

import { CommonApi } from './common';
import Records from '../components/Records';
import { copyToClipboard, t } from '../helpers/util';
import { SourcesId } from '../constants';

const context = SourcesId.USER_CONF + '@';

export class UserConfigApi extends CommonApi {
  saveConfig = ({ data }) => {
    const rec = Records.get(context);

    rec.att('data?json', data);

    return rec
      .save()
      .then(rec => rec)
      .catch(e => {
        console.error(e);
        return null;
      });
  };

  getConfig = ({ id }) => {
    if (id) {
      return Records.get(`${context}${id}`)
        .load('data?json')
        .then(res => res)
        .catch(e => {
          console.error(e);
          return null;
        });
    }

    return Promise.resolve(null);
  };

  copyUrlConfig = ({ data, url }) => {
    NotificationManager.info('', t('export-component.notice.buffer-link-preparation'));

    this.saveConfig({ data })
      .then(response => {
        const fullId = get(response, 'id');
        const shortId = fullId && get(fullId.split(context), '[1]');
        const copied = copyToClipboard(`${url}&userConfigId=${shortId}`);

        if (shortId && copied) {
          NotificationManager.success(t('export-component.notice.buffer-link-done'), t('success'), 3000);
        } else {
          NotificationManager.warning(t('export-component.notice.buffer-link-err'));
        }
      })
      .catch(e => {
        console.error(e);
        NotificationManager.error(t('export-component.notice.buffer-link-err'), t('error'));
      });
  };
}
