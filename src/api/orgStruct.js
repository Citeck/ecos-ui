import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';

import { AUTHORITY_TYPE_GROUP, AUTHORITY_TYPE_USER, DataTypes, ITEMS_PER_PAGE } from '../components/common/form/SelectOrgstruct/constants';
import Records from '../components/Records';
import { SourcesId } from '../constants';
import { PROXY_URI } from '../constants/alfresco';
import { converterUserList } from '../components/common/form/SelectOrgstruct/helpers';
import { getCurrentUserName, isNodeRef } from '../helpers/util';
import { RecordService } from './recordService';

export class OrgStructApi extends RecordService {
  getUsers = (searchText = '') => {
    console.warn({ searchText });

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

  fetchGroup = ({ query, excludeAuthoritiesByType = [], ...extra }) => {
    const { groupName, searchText } = query;
    // Cause: https://citeck.atlassian.net/browse/ECOSCOM-2812: filter by group type or subtype
    const filterByType = items =>
      items.filter(item => {
        if (item.groupType === '') {
          return true;
        }

        return excludeAuthoritiesByType.indexOf(item.groupType) === -1 && excludeAuthoritiesByType.indexOf(item.groupSubType) === -1;
      });
    let queryVal = searchText
      ? OrgStructApi.getSearchQuery(searchText)
      : [
          {
            t: 'contains',
            a: 'authorityGroups',
            v: `${SourcesId.GROUP}@${groupName}`
          }
        ];

    const groups = Records.query(
      {
        sourceId: SourcesId.GROUP,
        query: { t: 'and', v: queryVal },
        language: 'predicate'
      },
      {
        displayName: '?disp',
        fullName: 'authorityName',
        groupSubType: 'groupSubType!""',
        groupType: 'groupType!""',
        nodeRef: '?id',
        authorityType: `authorityType!"${AUTHORITY_TYPE_GROUP}"`
      }
    )
      .then(r => get(r, 'records', []))
      .then(filterByType)
      .then(records =>
        records.map(record => ({
          ...record,
          shortName: get(record, 'fullName', '').replace('GROUP_', '')
        }))
      );

    const users = Records.query(
      {
        sourceId: SourcesId.PERSON,
        query: { t: 'and', v: queryVal },
        language: 'predicate'
      },
      {
        displayName: '?disp',
        fullName: 'authorityName',
        email: 'email',
        isPersonDisabled: 'personDisabled?bool',
        firstName: 'firstName',
        lastName: 'lastName',
        nodeRef: '?id',
        authorityType: `authorityType!"${AUTHORITY_TYPE_USER}"`
      }
    ).then(r => get(r, 'records', []));

    return Promise.all([groups, users]).then(([groups, users]) => [...groups, ...users]);
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

  _prepareRecordRef = async recordRef => {
    const authorityType = recordRef.includes(SourcesId.GROUP) ? AUTHORITY_TYPE_GROUP : AUTHORITY_TYPE_USER;

    if (recordRef.includes('workspace://SpacesStore')) {
      const attributes = await Records.get(recordRef).load({
        userName: 'cm:userName',
        authorityName: 'cm:authorityName'
      });

      if (get(attributes, 'userName')) {
        return {
          authorityType,
          recordRef: `${SourcesId.PERSON}@${attributes.userName}`
        };
      }

      if (get(attributes, 'authorityName')) {
        return {
          recordRef: `${SourcesId.GROUP}@${attributes.authorityName.replace('GROUP_', '')}`,
          authorityType: AUTHORITY_TYPE_GROUP
        };
      }

      return {
        authorityType,
        recordRef: `${SourcesId.PERSON}@${recordRef}`
      };
    }

    if (recordRef.includes('accountant')) {
      return {
        recordRef: `${SourcesId.GROUP}@${recordRef.replace('GROUP_', '')}`,
        authorityType: AUTHORITY_TYPE_GROUP
      };
    }

    return { recordRef, authorityType };
  };

  fetchAuthorityByRef = async nodeRef => {
    const { recordRef, authorityType } = await this._prepareRecordRef(nodeRef);

    return Records.get(recordRef).load({
      displayName: '?disp',
      fullName: 'authorityName',
      isPersonDisabled: 'personDisabled?bool',
      firstName: 'firstName',
      lastName: 'lastName',
      nodeRef: '?id',
      authorityType: `authorityType!"${authorityType || ''}"`
    });
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

  static getSearchQuery = (search = '', searchFields = ['id', '_name']) => {
    const valRaw = search.trim();
    const val = valRaw.split(' ').filter(item => !!item);
    const queryVal = [
      {
        t: 'contains',
        a: 'authorityGroupsFull',
        v: 'emodel/authority-group@_orgstruct_home_'
      }
    ];

    if (isEmpty(val)) {
      return queryVal;
    }

    if (val.length < 2) {
      queryVal.push({
        t: 'or',
        v: searchFields.map(a => ({
          t: 'contains',
          a,
          v: val[0]
        }))
      });
    } else {
      queryVal.push({
        t: 'or',
        v: searchFields.map(a => ({
          t: 'or',
          v: [
            {
              t: 'contains',
              a,
              v: val.join(' ')
            },
            {
              t: 'contains',
              a,
              v: val.reverse().join(' ')
            }
          ]
        }))
      });
    }

    return queryVal;
  };

  static async getUserList(searchText, extraFields = [], params = { page: 0, maxItems: ITEMS_PER_PAGE }) {
    const searchFields = ['id', '_name'];
    let queryVal = [];

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
      const addExtraFields = (fields = []) => {
        searchFields.push(...fields.map(field => field.trim()).filter(field => !!field));
      };

      const globalSearchConfig = await OrgStructApi.getGlobalSearchFields();
      if (Array.isArray(globalSearchConfig) && globalSearchConfig.length > 0) {
        addExtraFields(globalSearchConfig);
      }

      if (Array.isArray(extraFields) && extraFields.length > 0) {
        addExtraFields(extraFields);
      }
    }

    queryVal = queryVal.concat(OrgStructApi.getSearchQuery(searchText, searchFields));

    return Records.query(
      {
        sourceId: SourcesId.PERSON,
        query: { t: 'and', v: queryVal },
        page: {
          maxItems: params.maxItems,
          skipCount: params.page * params.maxItems
        },
        language: 'predicate'
      },
      {
        displayName: '?disp',
        fullName: 'authorityName',
        email: 'email',
        isPersonDisabled: 'personDisabled?bool',
        firstName: 'firstName',
        lastName: 'lastName',
        nodeRef: '?id',
        authorityType: `authorityType!"${AUTHORITY_TYPE_USER}"`
      }
    ).then(result => ({
      items: converterUserList(result.records),
      totalCount: result.totalCount
    }));
  }
}
