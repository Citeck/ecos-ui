import { USER_GUEST } from '@citeck/constants';

import * as storage from '../helpers/ls';
import { isNewVersionPage } from '../helpers/urls';
import ConfigService, { TABS_ENABLED } from '../services/config/ConfigService';

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
    return ConfigService.getValue(TABS_ENABLED);
  };
}
