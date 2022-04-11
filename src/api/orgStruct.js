import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';

import {
  AUTHORITY_TYPE_GROUP,
  AUTHORITY_TYPE_USER,
  DataTypes,
  ITEMS_PER_PAGE,
  ROOT_GROUP_NAME
} from '../components/common/form/SelectOrgstruct/constants';
import { converterUserList, getGroupName, getGroupRef, getPersonRef, getAuthRef } from '../components/common/form/SelectOrgstruct/helpers';
import Records from '../components/Records';
import { getCurrentUserName } from '../helpers/util';
import { SourcesId } from '../constants';
import { RecordService } from './recordService';
import ConfigService, { ORGSTRUCT_SEARCH_USER_EXTRA_FIELDS } from '../services/config/ConfigService';

export class OrgStructApi extends RecordService {
  get groupAttributes() {
    return {
      displayName: '?disp',
      fullName: 'authorityName',
      groupSubType: 'groupSubType!""',
      groupType: 'groupType!""',
      nodeRef: '?id',
      authorityType: `authorityType!"${AUTHORITY_TYPE_GROUP}"`
    };
  }

  static get userAttributes() {
    return {
      displayName: '?disp',
      fullName: 'authorityName',
      email: 'email',
      isPersonDisabled: 'personDisabled?bool',
      firstName: 'firstName',
      lastName: 'lastName',
      nodeRef: '?id',
      authorityType: `authorityType!"${AUTHORITY_TYPE_USER}"`
    };
  }

  getUsers = (searchText = '') => {
    return OrgStructApi.getUserList(searchText, [], { maxItems: 50 }).then(result =>
      get(result, 'items', []).map(item => get(item, 'attributes', {}))
    );
  };

  _prepareGroups = groups =>
    (groups || []).map(group => ({
      ...group,
      groupType: (group.groupType || '').toUpperCase(),
      groupSubType: (group.groupSubType || '').toUpperCase(),
      shortName: getGroupName(group.fullName || '')
    }));

  fetchGroup = ({ query, excludeAuthoritiesByType = [], excludeAuthoritiesByName, isIncludedAdminGroup }) => {
    const { groupName, searchText } = query;
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
            v: getGroupRef(groupName)
          }
        ];
    const extraQueryVal = [];

    if (excludeAuthoritiesByName) {
      excludeAuthoritiesByName.split(',').forEach(name => {
        extraQueryVal.push({
          t: 'not',
          v: {
            t: 'contains',
            a: '_name',
            v: name
          }
        });
      });
    }

    const groups = Records.query(
      {
        sourceId: SourcesId.GROUP,
        query: { t: 'and', v: [...queryVal, ...extraQueryVal] },
        language: 'predicate'
      },
      { ...this.groupAttributes }
    )
      .then(r => get(r, 'records', []))
      .then(filterByType)
      .then(this._prepareGroups)
      .then(records => {
        if (isIncludedAdminGroup && groupName === ROOT_GROUP_NAME) {
          records.unshift({
            id: getGroupRef('ALFRESCO_ADMINISTRATORS'),
            displayName: 'ALFRESCO_ADMINISTRATORS',
            fullName: 'GROUP_ALFRESCO_ADMINISTRATORS',
            shortName: 'ALFRESCO_ADMINISTRATORS',
            groupSubType: '',
            groupType: 'BRANCH',
            nodeRef: getGroupRef('ALFRESCO_ADMINISTRATORS'),
            authorityType: AUTHORITY_TYPE_GROUP
          });
        }

        return records;
      });

    const users = Records.query(
      {
        sourceId: SourcesId.PERSON,
        query: { t: 'and', v: queryVal },
        language: 'predicate'
      },
      { ...OrgStructApi.userAttributes }
    ).then(r => get(r, 'records', []));

    return Promise.all([groups, users]).then(([groups, users]) => [...groups, ...users]);
  };

  fetchAuthority = (dataType, value) => {
    let recordRef = value;

    if (dataType === DataTypes.AUTHORITY) {
      recordRef = getAuthRef(recordRef);
    }

    return this.fetchAuthorityByRef(recordRef);
  };

  static prepareRecordRef = async recordRef => {
    const authorityType = recordRef.includes(SourcesId.GROUP) ? AUTHORITY_TYPE_GROUP : AUTHORITY_TYPE_USER;

    if (recordRef.includes(SourcesId.GROUP) || recordRef.includes(SourcesId.PERSON)) {
      return {
        recordRef,
        authorityType
      };
    }

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
          recordRef: getGroupRef(getGroupName(attributes.authorityName)),
          authorityType: AUTHORITY_TYPE_GROUP
        };
      }

      return {
        authorityType,
        recordRef: getPersonRef(recordRef)
      };
    }

    if (recordRef.includes(`${AUTHORITY_TYPE_GROUP}_`)) {
      return {
        recordRef: getGroupRef(getGroupName(recordRef)),
        authorityType: AUTHORITY_TYPE_GROUP
      };
    }

    return {
      recordRef: getPersonRef(recordRef),
      authorityType
    };
  };

  fetchAuthorityByRef = async nodeRef => {
    const { recordRef, authorityType } = await OrgStructApi.prepareRecordRef(nodeRef);

    if (authorityType === AUTHORITY_TYPE_USER) {
      return Records.get(recordRef).load(OrgStructApi.userAttributes);
    }

    return Records.get(recordRef)
      .load(this.groupAttributes)
      .then(this._prepareGroups);
  };

  static async getGlobalSearchFields() {
    return ConfigService.getValue(ORGSTRUCT_SEARCH_USER_EXTRA_FIELDS);
  }

  static getSearchQuery = (search = '', searchFields = ['id', '_name']) => {
    const valRaw = search.trim();
    const val = valRaw.split(' ').filter(item => !!item);
    const queryVal = [
      {
        t: 'contains',
        a: 'authorityGroupsFull',
        v: getGroupRef(ROOT_GROUP_NAME)
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
      const isAdmin = Boolean(await Records.get(getPersonRef(userName)).load('isAdmin?bool'));
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
      { ...OrgStructApi.userAttributes }
    ).then(result => ({
      items: converterUserList(result.records),
      totalCount: result.totalCount
    }));
  }
}
