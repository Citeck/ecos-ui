import get from 'lodash/get';

import Records from '../components/Records';
import { USER_GUEST } from '../constants';
import { PROXY_URI } from '../constants/alfresco';
import * as storage from '../helpers/ls';
import { isNodeRef } from '../helpers/util';
import { isNewVersionPage } from '../helpers/urls';
import { CommonApi } from './common';

export class PageTabsApi extends CommonApi {
  #lsKey = storage.generateKey('page-tabs', true);
  #newVersionKeyPath = '/v3/user-';

  get lsKey() {
    return this.#lsKey;
  }

  set lsKey(key) {
    this.#lsKey = key;
  }

  getAll = () => {
    let tabs = [];

    if (storage.hasData(this.lsKey, 'array')) {
      tabs = storage.getData(this.lsKey);
    }

    return tabs;
  };

  checkOldVersion = userName => {
    if (userName === USER_GUEST || this.lsKey.includes(this.#newVersionKeyPath)) {
      return;
    }

    const currentVersion = this.lsKey;
    const newVersionKey = `${this.lsKey}${this.#newVersionKeyPath}${userName}`;

    storage.transferData(currentVersion, newVersionKey, true);
    this.lsKey = newVersionKey;
  };

  getTabTitle = ({ recordRef, journalId = null }) => {
    if (journalId) {
      if (isNodeRef(journalId)) {
        return Records.get(journalId)
          .load('.disp')
          .then(response => response);
      }

      return this.getJson(`${PROXY_URI}api/journals/config?journalId=${journalId}`)
        .then(response => get(response, 'meta.title', ''))
        .catch(() => {});
    }

    return Records.get(recordRef)
      .load({ displayName: '.disp' }, true)
      .then(response => response);
  };

  getShowStatus = () => {
    if (!isNewVersionPage()) {
      return Promise.resolve(false);
    }

    return Records.get('uiserv/config@tabs-enabled')
      .load('value?bool')
      .then(value => {
        return value != null ? value : true;
      })
      .catch(() => {
        return false;
      });
  };
}
