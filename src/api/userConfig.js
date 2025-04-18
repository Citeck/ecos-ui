import get from 'lodash/get';

import Records from '../components/Records';
import { SourcesId } from '../constants';
import CopyToClipboard from '../helpers/copyToClipboard';
import { getLinkWithWs, getWorkspaceId } from '../helpers/urls';
import { getEnabledWorkspaces, t } from '../helpers/util';

import { CommonApi } from './common';

import { NotificationManager } from '@/services/notifications';

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

    return this.saveConfig({ data })
      .then(response => {
        const fullId = get(response, 'id');
        const shortId = fullId && get(fullId.split(context), '[1]');
        const text = `${url}&userConfigId=${shortId}`;
        const copied = CopyToClipboard.copy(getEnabledWorkspaces() ? getLinkWithWs(text, getWorkspaceId(), true) : text);

        if (shortId && copied) {
          NotificationManager.success(t('export-component.notice.buffer-link-done'), t('success'), 3000);
        } else if (copied !== undefined) {
          NotificationManager.warning(t('export-component.notice.buffer-link-err'));
        }
      })
      .catch(e => {
        console.error(e);
        NotificationManager.error(t('export-component.notice.buffer-link-err'), t('error'));
      });
  };
}

export const instUserConfigApi = new UserConfigApi();
