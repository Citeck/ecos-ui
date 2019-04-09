import { RecordService } from './recordService';
import { PROXY_URI } from '../constants/alfresco';

export class OrgStructApi extends RecordService {
  _defaultQuery = {
    groupName: '_orgstruct_home_',
    searchText: ''
  };

  _loaded = {};

  getUsers = (searchText = '') => {
    let url = `${PROXY_URI}/api/orgstruct/v2/group/_orgstruct_home_/children?branch=false&role=false&group=false&user=true&recurse=true&excludeAuthorities=all_users`;
    if (searchText) {
      url += `&filter=${searchText}`;
    }
    return this.getJson(url).catch(() => []);
  };

  fetchGroup = (query = this._defaultQuery) => {
    const queryStr = JSON.stringify(query);

    if (this._loaded[queryStr]) {
      return Promise.resolve(this._loaded[queryStr]);
    }

    const { groupName, searchText } = query;

    let url = `${PROXY_URI}/api/orgstruct/v2/group/${groupName}/children?branch=true&role=true&group=true&user=true&excludeAuthorities=all_users`;
    if (searchText) {
      url += `&filter=${searchText}`;
    }
    return this.getJson(url)
      .then(result => {
        this._loaded[queryStr] = result;
        console.log('this._loaded', this._loaded);
        return result;
      })
      .catch(() => []);
  };
}
