import * as ls from '../helpers/ls';

export class PageTabsApi {
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

  checkOldVersion(uid) {
    const currentVersion = this.lsKey;
    const newVersionKey = `${this.lsKey}${this._newVersionKeyPath}-${uid}`;

    if (this.lsKey.includes(this._newVersionKeyPath)) {
      return;
    }

    ls.transferData(currentVersion, newVersionKey, true);
    this.lsKey = newVersionKey;
  }

  set = tabs => {
    ls.setData(this.lsKey, tabs);
  };
}
