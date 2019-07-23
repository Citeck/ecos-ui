import * as ls from '../helpers/ls';

export class PageTabsApi {
  lsKey = ls.generateKey('page-tabs', true);

  getAll = () => {
    let tabs = [];

    if (ls.hasData(this.lsKey, 'array')) {
      tabs = ls.getData(this.lsKey);
    }

    return tabs;
  };

  set = tabs => {
    ls.setData(this.lsKey, tabs);
  };
}
