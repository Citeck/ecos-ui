import ActionsExecutor from '../ActionsExecutor';
import * as queryString from 'query-string';
import ecosFetch from '../../../../../helpers/ecosFetch';
import dialogManager from '../../../../common/dialogs/Manager/DialogManager';
import { t } from '../../../../../helpers/export/util';
import { notifySuccess, notifyFailure } from '../../util/actionUtils';

export default class FetchAction extends ActionsExecutor {
  static ACTION_ID = 'fetch';

  async execForRecord(record, action, context) {
    const { config } = action;
    const { url, args, ...options } = config || {};
    const fullUrl = `${url}?${queryString.stringify({ ...args })}`;

    return ecosFetch(fullUrl, options)
      .then(response => (response.ok ? response : Promise.reject({ message: response.statusText })))
      .then(result => {
        notifySuccess();
        return result;
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
