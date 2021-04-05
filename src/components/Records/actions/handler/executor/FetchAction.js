import * as queryString from 'query-string';

import ecosFetch from '../../../../../helpers/ecosFetch';
import { t } from '../../../../../helpers/export/util';
import dialogManager from '../../../../common/dialogs/Manager/DialogManager';
import { notifySuccess, notifyFailure } from '../../util/actionUtils';
import ActionsExecutor from '../ActionsExecutor';

export default class FetchAction extends ActionsExecutor {
  static ACTION_ID = 'fetch';

  async execForRecord(record, action, context) {
    const { config } = action;
    const { url, args, ...options } = config || {};
    const fullUrl = `${url}?${queryString.stringify({ ...args })}`;

    return ecosFetch(fullUrl, options)
      .then(response => (response && response.ok ? response : Promise.reject({ message: response.statusText })))
      .then(response => {
        notifySuccess();
        const type = response.headers.get('Content-Type') || '';
        if (type.includes('json')) {
          return response.json();
        }

        return true;
      })
      .catch(e => {
        notifyFailure();
        dialogManager.showInfoDialog({ title: t('error'), text: e.message });
      });
  }

  getDefaultActionModel() {
    return {
      name: 'record-action.name.fetch-action',
      icon: 'icon-small-right'
    };
  }
}
