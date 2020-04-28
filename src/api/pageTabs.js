import Records from '../components/Records';
import { SourcesId, USER_GUEST } from '../constants';
import * as storage from '../helpers/ls';
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

  checkOldVersion = userName => {
    if (userName === USER_GUEST || this.lsKey.includes(this.#newVersionKeyPath)) {
      return;
    }

    const currentVersion = this.lsKey;
    const newVersionKey = `${this.lsKey}${this.#newVersionKeyPath}${userName}`;

    storage.transferData(currentVersion, newVersionKey, true);
    this.lsKey = newVersionKey;
  };

  getShowStatus = () => {
    if (!isNewVersionPage()) {
      return Promise.resolve(false);
    }

    return Records.get(`${SourcesId.CONFIG}@tabs-enabled`)
      .load('value?bool')
      .then(value => {
        return value != null ? value : true;
      })
      .catch(() => {
        return false;
      });
  };
}
