import { RecordService } from './recordService';
import Records from '../components/Records';
import { PROXY_URI } from '../constants/alfresco';
import { converterUserList } from '../components/common/form/SelectOrgstruct/helpers';

export const ROOT_ORGSTRUCT_GROUP = '_orgstruct_home_';

export class OrgStructApi extends RecordService {
  _loadedAuthorities = {};
  _loadedGroups = {};

  getUsers = (searchText = '') => {
    let url = `${PROXY_URI}/api/orgstruct/v2/group/_orgstruct_home_/children?branch=false&role=false&group=false&user=true&recurse=true&excludeAuthorities=all_users`;
    if (searchText) {
      url += `&filter=${searchText}`;
    }
    return this.getJson(url).catch(() => []);
  };

  fetchGroup = ({ query, excludeAuthoritiesByName = '', excludeAuthoritiesByType = [] }) => {
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

  static getUserList(searchText) {
    const val = searchText.trim();

    const queryVal = [
      {
        t: 'eq',
        att: 'TYPE',
        val: 'cm:person'
      }
    ];

    if (searchText) {
      queryVal.push({
        t: 'or',
        val: [
          {
            t: 'contains',
            att: 'cm:userName',
            val
          },
          {
            t: 'contains',
            att: 'cm:firstName',
            val
          },
          {
            t: 'contains',
            att: 'cm:lastName',
            val
          }
        ]
      });
    }

    return Records.query(
      {
        query: { t: 'and', val: queryVal },
        language: 'predicate',
        page: {
          maxItems: 20,
          skipCount: 0
        }
      },
      {
        fullName: '.disp',
        userName: 'userName'
      }
    ).then(result => converterUserList(result.records));
  }
}
