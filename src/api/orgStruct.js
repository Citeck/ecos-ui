import { RecordService } from './recordService';
import Records from '../components/Records';
import { SourcesId } from '../constants';
import { PROXY_URI } from '../constants/alfresco';
import { converterUserList } from '../components/common/form/SelectOrgstruct/helpers';
import { getCurrentUserName } from '../helpers/util';

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

  static async getGlobalSearchFields() {
    return Records.get(`${SourcesId.CONFIG}@orgstruct-search-user-extra-fields`)
      .load('value?str')
      .then(searchFields => {
        if (typeof searchFields !== 'string' || !searchFields.trim().length) {
          return [];
        }

        return searchFields.split(',');
      })
      .catch(() => []);
  }

  static async getUserList(searchText, extraFields = []) {
    const val = searchText.trim();

    const queryVal = [
      {
        t: 'eq',
        att: 'TYPE',
        val: 'cm:person'
      }
    ];

    const predicateNotDisabledAndAvailable = {
      t: 'and',
      val: [
        {
          t: 'not-eq',
          att: 'ecos:isPersonDisabled',
          val: 'true'
        },
        {
          t: 'eq',
          att: 'deputy:available',
          val: 'true'
        }
      ]
    };

    const isHideForAll = Boolean(await Records.get('ecos-config@hide-disabled-users-for-everyone').load('.bool'));
    if (isHideForAll) {
      queryVal.push(predicateNotDisabledAndAvailable);
    } else {
      const userName = getCurrentUserName();
      const isAdmin = Boolean(await Records.get(`${SourcesId.PEOPLE}@${userName}`).load('isAdmin?bool'));
      if (!isAdmin) {
        const showInactiveUserOnlyForAdmin = Boolean(
          await Records.get('ecos-config@orgstruct-show-inactive-user-only-for-admin').load('.bool')
        );
        if (showInactiveUserOnlyForAdmin) {
          queryVal.push(predicateNotDisabledAndAvailable);
        }
      }
    }

    if (searchText) {
      const searchFields = ['cm:userName', 'cm:firstName', 'cm:lastName'];
      const addExtraFields = (fields = []) => {
        searchFields.push(...fields.map(field => field.trim()));
      };

      const globalSearchConfig = await OrgStructApi.getGlobalSearchFields();
      if (Array.isArray(globalSearchConfig) && globalSearchConfig.length > 0) {
        addExtraFields(globalSearchConfig);
      }

      if (Array.isArray(extraFields) && extraFields.length > 0) {
        addExtraFields(extraFields);
      }

      queryVal.push({
        t: 'or',
        val: searchFields.map(att => ({
          t: 'contains',
          att,
          val
        }))
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
