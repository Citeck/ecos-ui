import get from 'lodash/get';

import Records from '../components/Records';
import { CommonApi } from './common';
import * as ls from '../helpers/ls';
import { USER_GUEST } from '../constants';
import { deepClone, isNodeRef } from '../helpers/util';
import { decodeLink, isNewVersionPage } from '../helpers/urls';
import { PROXY_URI } from '../constants/alfresco';

export class PageTabsApi extends CommonApi {
  _lsKey = ls.generateKey('page-tabs', true);
  _newVersionKeyPath = '/user';

  get lsKey() {
    return this._lsKey;
  }

  set lsKey(key) {
    this._lsKey = key;
  }

  getAll = () => {
    let tabs = [];

    if (ls.hasData(this.lsKey, 'array')) {
      tabs = ls.getData(this.lsKey);
    }

    return tabs;
  };

  checkOldVersion = userName => {
    if (userName === USER_GUEST || this.lsKey.includes(this._newVersionKeyPath)) {
      return;
    }

    const currentVersion = this.lsKey;
    const newVersionKey = `${this.lsKey}${this._newVersionKeyPath}-${userName}`;

    ls.transferData(currentVersion, newVersionKey, true);
    this.lsKey = newVersionKey;
  };

  set = tabs => {
    const upTabs = deepClone(tabs);

    upTabs.forEach(item => (item.link = decodeLink(item.link)));

    ls.setData(this.lsKey, upTabs);
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
