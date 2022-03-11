import * as queryString from 'query-string';
import get from 'lodash/get';

import { AUTHORITY_TYPE_GROUP, AUTHORITY_TYPE_USER, DataTypes, ITEMS_PER_PAGE } from '../components/common/form/SelectOrgstruct/constants';
import Records from '../components/Records';
import { SourcesId } from '../constants';
import { PROXY_URI } from '../constants/alfresco';
import { converterUserList } from '../components/common/form/SelectOrgstruct/helpers';
import { getCurrentUserName, isNodeRef } from '../helpers/util';
import { RecordService } from './recordService';

export class OrgStructApi extends RecordService {
  _loadedAuthorities = {};
  _loadedGroups = {};

  getUsers = (searchText = '') => {
    let url = `${PROXY_URI}api/orgstruct/v2/group/_orgstruct_home_/children?branch=false&role=false&group=false&user=true&recurse=true&excludeAuthorities=all_users`;
    if (searchText) {
      url += `&filter=${searchText}`;
    }
    return this.getJson(url).catch(() => []);
  };

  // getUsers = (searchText = '') => {
  //   if (searchText) {
  //   }
  //
  //   return Records.query({
  //     sourceId: 'emodel/person',
  //     query: {
  //       t: 'contains',
  //       a: 'authorityGroupsAll',
  //       v: 'emodel/authority-group@_orgstruct_home_'
  //     },
  //     language: 'predicate'
  //   });
  // };

  // fetchGroup = ({ query, excludeAuthoritiesByName = '', excludeAuthoritiesByType = [], isIncludedAdminGroup }) => {
  //   excludeAuthoritiesByName = excludeAuthoritiesByName
  //     .split(',')
  //     .map(item => item.trim())
  //     .join(',');
  //
  //   const queryStr = JSON.stringify({ query, excludeAuthoritiesByName, excludeAuthoritiesByType, isIncludedAdminGroup });
  //
  //   if (this._loadedGroups[queryStr]) {
  //     return Promise.resolve(this._loadedGroups[queryStr]);
  //   }
  //
  //   const { groupName, searchText } = query;
  //   const urlQuery = { excludeAuthorities: excludeAuthoritiesByName, addAdminGroup: !!isIncludedAdminGroup };
  //
  //   if (searchText) {
  //     urlQuery.filter = searchText;
  //     urlQuery.recurse = true;
  //   }
  //
  //   const url = queryString.stringifyUrl({
  //     url: `${PROXY_URI}api/orgstruct/v2/group/${groupName}/children?branch=true&role=true&group=true&user=true`,
  //     query: urlQuery
  //   });
  //
  //   // Cause: https://citeck.atlassian.net/browse/ECOSCOM-2812: filter by group type or subtype
  //   const filterByType = items =>
  //     items.filter(item => {
  //       return excludeAuthoritiesByType.indexOf(item.groupType) === -1 && excludeAuthoritiesByType.indexOf(item.groupSubType) === -1;
  //     });
  //
  //   return this.getJson(url)
  //     .then(filterByType)
  //     .then(filtered => {
  //       this._loadedGroups[queryStr] = filtered;
  //
  //       console.warn({ filtered });
  //       return filtered;
  //     })
  //     .catch(() => []);
  // };

  fetchGroup = async ({ query, excludeAuthoritiesByName = '', excludeAuthoritiesByType = [], isIncludedAdminGroup }) => {
    excludeAuthoritiesByName = excludeAuthoritiesByName
      .split(',')
      .map(item => item.trim())
      .join(',');

    const { groupName } = query;
    // Cause: https://citeck.atlassian.net/browse/ECOSCOM-2812: filter by group type or subtype
    const filterByType = items =>
      items.filter(item => {
        return excludeAuthoritiesByType.indexOf(item.groupType) === -1 && excludeAuthoritiesByType.indexOf(item.groupSubType) === -1;
      });

    const groups = await Records.query(
      {
        sourceId: SourcesId.GROUP,
        query: {
          t: 'contains',
          a: 'authorityGroups',
          v: `${SourcesId.GROUP}@${groupName}`
        },
        language: 'predicate'
      },
      {
        displayName: '?disp',
        fullName: 'authorityName',
        groupSubType: 'groupSubType!""',
        groupType: 'groupType!""',
        nodeRef: '?id'
      }
    )
      .then(r => get(r, 'records', []))
      .then(filterByType)
      .then(records =>
        records.map(record => ({
          ...record,
          shortName: get(record, 'fullName', '').replace('GROUP_', ''),
          authorityType: AUTHORITY_TYPE_GROUP
        }))
      );

    const users = await Records.query(
      {
        sourceId: SourcesId.PERSON,
        query: {
          t: 'contains',
          a: 'authorityGroups',
          v: `${SourcesId.GROUP}@${groupName}`
        },
        language: 'predicate'
      },
      {
        displayName: '?disp',
        fullName: 'authorityName',
        email: 'email',
        isPersonDisabled: 'personDisabled?bool',
        // available: '',
        firstName: 'firstName',
        lastName: 'lastName',
        nodeRef: '?id'
      }
    ).then(r => {
      return get(r, 'records', []).map(record => ({
        ...record,
        authorityType: AUTHORITY_TYPE_USER
      }));
    });

    console.warn({ groups, users, groupName });

    return [...groups, ...users];
  };

  fetchAuthName = id => {
    return Records.get(id).load('cm:authorityName!cm:userName');
  };

  fetchAuthority = (dataType, value) => {
    if (dataType === DataTypes.AUTHORITY && !isNodeRef(value)) {
      return this.fetchAuthorityByName(value);
    }

    return this.fetchAuthorityByRef(value);
  };

  fetchAuthorityByRef = nodeRef => {
    if (this._loadedAuthorities[nodeRef]) {
      return Promise.resolve(this._loadedAuthorities[nodeRef]);
    }

    let url = `${PROXY_URI}api/orgstruct/authority?nodeRef=${nodeRef}`;

    return this.getJson(url)
      .then(result => {
        this._loadedAuthorities[nodeRef] = result;
        return result;
      })
      .catch(() => (isNodeRef(nodeRef) ? { nodeRef } : { nodeRef, name: nodeRef }));
  };

  fetchAuthorityByName = async (authName = '') => {
    const nodeRef = await Records.get(`${SourcesId.A_AUTHORITY}@${authName}`).load('nodeRef?str');
    return this.fetchAuthorityByRef(nodeRef);
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

  static async getUserList(searchText, extraFields = [], params = { page: 0, maxItems: ITEMS_PER_PAGE }) {
    const valRaw = searchText.trim();
    const val = valRaw.split(' ');

    const queryVal = [
      {
        t: 'eq',
        att: 'TYPE',
        val: 'cm:person'
      }
    ];

    const predicateNotDisabled = {
      t: 'not-eq',
      att: 'ecos:isPersonDisabled',
      val: 'true'
    };

    const isHideForAll = Boolean(await Records.get('ecos-config@hide-disabled-users-for-everyone').load('.bool'));
    if (isHideForAll) {
      queryVal.push(predicateNotDisabled);
    } else {
      const userName = getCurrentUserName();
      const isAdmin = Boolean(await Records.get(`${SourcesId.PEOPLE}@${userName}`).load('isAdmin?bool'));
      if (!isAdmin) {
        const showInactiveUserOnlyForAdmin = Boolean(
          await Records.get('ecos-config@orgstruct-show-inactive-user-only-for-admin').load('.bool')
        );
        if (showInactiveUserOnlyForAdmin) {
          queryVal.push(predicateNotDisabled);
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

      if (val.length < 2) {
        queryVal.push({
          t: 'or',
          val: searchFields.map(att => ({
            t: 'contains',
            att: att,
            val: val[0]
          }))
        });
      } else {
        const firstLast = {
          t: 'and',
          val: [
            {
              t: 'contains',
              att: 'cm:firstName',
              val: val[0]
            },
            {
              t: 'contains',
              att: 'cm:lastName',
              val: val[1]
            }
          ]
        };

        const lastFirst = {
          t: 'and',
          val: [
            {
              t: 'contains',
              att: 'cm:lastName',
              val: val[0]
            },
            {
              t: 'contains',
              att: 'cm:firstName',
              val: val[1]
            }
          ]
        };

        queryVal.push({
          t: 'or',
          val: [firstLast, lastFirst]
        });
      }
    }

    return Records.query(
      {
        query: { t: 'and', val: queryVal },
        language: 'predicate',
        consistency: 'EVENTUAL',
        page: {
          maxItems: params.maxItems,
          skipCount: params.page * params.maxItems
        }
      },
      {
        fullName: '.disp',
        userName: 'userName'
      }
    ).then(result => ({
      items: converterUserList(result.records),
      totalCount: result.totalCount
    }));
  }
}
