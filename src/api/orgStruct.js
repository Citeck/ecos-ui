import { RecordService } from './recordService';
import { PROXY_URI } from '../constants/alfresco';

export const ROOT_ORGSTRUCT_GROUP = '_orgstruct_home_';

export class OrgStructApi extends RecordService {
  _defaultQuery = {
    groupName: ROOT_ORGSTRUCT_GROUP,
    searchText: ''
  };

  _loadedAuthorities = {};
  _loadedGroups = {};

  getUsers = (searchText = '') => {
    let url = `${PROXY_URI}/api/orgstruct/v2/group/_orgstruct_home_/children?branch=false&role=false&group=false&user=true&recurse=true&excludeAuthorities=all_users`;
    if (searchText) {
      url += `&filter=${searchText}`;
    }
    return this.getJson(url).catch(() => []);
  };

  fetchGroup = ({ query = this._defaultQuery, excludeAuthoritiesByName = '', excludeAuthoritiesByType = [] }) => {
    excludeAuthoritiesByName = excludeAuthoritiesByName
      .split(',')
      .map(item => item.trim())
      .join(',');

    const queryStr = JSON.stringify({ query, excludeAuthoritiesByName, excludeAuthoritiesByType });

    if (this._loadedGroups[queryStr]) {
      return Promise.resolve(this._loadedGroups[queryStr]);
    }

    const { groupName, searchText } = query;

    let url = `${PROXY_URI}/api/orgstruct/v2/group/${groupName}/children?branch=true&role=true&group=true&user=true&excludeAuthorities=${excludeAuthoritiesByName}`;
    if (searchText) {
      url += `&filter=${encodeURIComponent(searchText)}&recurse=true`;
    }

    // Cause: https://citeck.atlassian.net/browse/ECOSCOM-2812: filter by group type or subtype
    const filterByType = items =>
      items.filter(item => {
        return excludeAuthoritiesByType.indexOf(item.groupType) === -1 && excludeAuthoritiesByType.indexOf(item.groupSubType) === -1;
      });

    return this.getJson(url)
      .then(filterByType)
      .then(filtered => {
        this._loadedGroups[queryStr] = filtered;
        return filtered;
      })
      .catch(() => []);
  };

  fetchAuthority = nodeRef => {
    if (this._loadedAuthorities[nodeRef]) {
      return Promise.resolve(this._loadedAuthorities[nodeRef]);
    }

    let url = `${PROXY_URI}/api/orgstruct/authority?nodeRef=${nodeRef}`;
    return this.getJson(url)
      .then(result => {
        this._loadedAuthorities[nodeRef] = result;
        return result;
      })
      .catch(() => []);
  };
}
