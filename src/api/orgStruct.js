import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import isArray from 'lodash/isArray';
import isString from 'lodash/isString';

import {
  ALFRESCO_ADMINISTRATORS_GROUP,
  AUTHORITY_TYPE_GROUP,
  AUTHORITY_TYPE_USER,
  DataTypes,
  ITEMS_PER_PAGE,
  ROOT_GROUP_NAME
} from '../components/common/form/SelectOrgstruct/constants';
import {
  converterUserList,
  getGroupName,
  getGroupRef,
  getPersonRef,
  getAuthRef,
  getRecordRef
} from '../components/common/form/SelectOrgstruct/helpers';
import Records from '../components/Records';
import ConfigService, {
  ORGSTRUCT_SEARCH_USER_EXTRA_FIELDS,
  ORGSTRUCT_HIDE_DISABLED_USERS,
  ORGSTRUCT_SEARCH_USER_MIDLLE_NAME,
  ORGSTRUCT_SHOW_USERNAME_MASK,
  ORGSTRUCT_SHOW_INACTIVE_USER_ONLY_FOR_ADMIN,
  HIDE_IN_ORGSTRUCT
} from '../services/config/ConfigService';
import { SourcesId, DEFAULT_ORGSTRUCTURE_SEARCH_FIELDS } from '../constants';
import { CommonApi } from './common';

export class OrgStructApi extends CommonApi {
  get groupAttributes() {
    return {
      displayName: '?disp',
      firstName: 'firstName',
      lastName: 'lastName',
      fullName: 'authorityName',
      groupSubType: 'groupSubType!""',
      isPersonDisabled: 'personDisabled?bool',
      groupType: 'groupType!""',
      email: 'email',
      nodeRef: '?id',
      authorityType: `authorityType!"${AUTHORITY_TYPE_GROUP}"`,
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
      authorityType: `authorityType!"${AUTHORITY_TYPE_USER}"`,
      photo: "avatar.url",
    };
  }

  getUsers = (searchText = '') => {
    return OrgStructApi.getUserList(searchText, [], { maxItems: 50 }).then(result =>
      get(result, 'items', []).map(item => get(item, 'attributes', {}))
    );
  };

  _prepareGroups = groups => {
    const replace = group => ({
      ...group,
      groupType: (group.groupType || '').toUpperCase(),
      groupSubType: (group.groupSubType || '').toUpperCase(),
      shortName: getGroupName(group.fullName || '')
    });

    if (!Array.isArray(groups)) {
      return replace(groups);
    }

    return (groups || []).map(replace);
  };

  static getNotDisabledPredicate = async () => {
    const predicateNotDisabled = { t: 'not-eq', att: 'personDisabled', val: true };

    const isHideForAll = await OrgStructApi.fetchIsHideDisabledField();
    if (isHideForAll) {
      return predicateNotDisabled;
    } else {
      const isAdmin = await OrgStructApi.fetchIsAdmin();
      if (!isAdmin) {
        const showInactiveUserOnlyForAdmin = await OrgStructApi.fetchIsShowDisabledUser();
        if (showInactiveUserOnlyForAdmin) {
          return predicateNotDisabled;
        }
      }
    }

    return null;
  };

  static getSearchFields = async (searchText = '', extraFields = []) => {
    const searchFields = DEFAULT_ORGSTRUCTURE_SEARCH_FIELDS;

    if (searchText) {
      const addExtraFields = (fields = []) => {
        const attributes = fields.map(field => field.trim()).filter(field => !!field);

        searchFields.push(...attributes.filter(att => !searchFields.includes(att)));
      };

      const globalSearchConfig = await OrgStructApi.fetchGlobalSearchFields();

      if (Array.isArray(globalSearchConfig) && globalSearchConfig.length > 0) {
        addExtraFields(globalSearchConfig);
      }

      if (Array.isArray(extraFields) && extraFields.length > 0) {
        addExtraFields(extraFields);
      }

      const isSearchUserMiddleName = await OrgStructApi.fetchIsSearchUserMiddleName();

      if (isSearchUserMiddleName) {
        addExtraFields(['middleName']);
      }
    }

    return searchFields;
  };

  fetchGroup = async ({ query, excludeAuthoritiesByType = [], excludeAuthoritiesByName, isIncludedAdminGroup }) => {
    const { groupName, searchText } = query;
    const filterByType = items =>
      items.filter(item => {
        if (item.groupType === '') {
          return true;
        }

        return excludeAuthoritiesByType.indexOf(item.groupType) === -1 && excludeAuthoritiesByType.indexOf(item.groupSubType) === -1;
      });

    const searchFields = await OrgStructApi.getSearchFields(searchText);

    let queryVal = searchText
      ? OrgStructApi.getSearchQuery(searchText, searchFields)
      : [
          {
            t: 'contains',
            a: 'authorityGroups',
            v: getGroupRef(groupName)
          }
        ];

    const notDisabledPredicate = await OrgStructApi.getNotDisabledPredicate();
    if (notDisabledPredicate) {
      queryVal.push(notDisabledPredicate);
    }

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

    const globalSearchConfig = await OrgStructApi.fetchGlobalSearchFields();

    const excludedUsers = await OrgStructApi.fetchGlobalHideInOrgstruct();
    (excludedUsers || []).forEach(item => {
      if (item) {
        queryVal.push({ t: 'not-eq', att: 'id', val: item.replace('GROUP_', '') });
      }
    });

    const groups = Records.query(
      {
        sourceId: SourcesId.GROUP,
        query: { t: 'and', v: [...queryVal, ...extraQueryVal] },
        language: 'predicate'
      },
      { ...this.groupAttributes, ...globalSearchConfig }
    )
      .then(r => get(r, 'records', []))
      .then(filterByType)
      .then(this._prepareGroups)
      .then(records => {
        if (
          isIncludedAdminGroup &&
          groupName === ROOT_GROUP_NAME &&
          ALFRESCO_ADMINISTRATORS_GROUP.toLocaleLowerCase().includes(searchText.toLocaleLowerCase())
        ) {
          records.unshift({
            id: getGroupRef(ALFRESCO_ADMINISTRATORS_GROUP),
            displayName: ALFRESCO_ADMINISTRATORS_GROUP,
            fullName: 'GROUP_ALFRESCO_ADMINISTRATORS',
            shortName: ALFRESCO_ADMINISTRATORS_GROUP,
            groupSubType: '',
            groupType: 'BRANCH',
            nodeRef: getGroupRef(ALFRESCO_ADMINISTRATORS_GROUP),
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
      { ...OrgStructApi.userAttributes, ...globalSearchConfig }
    ).then(r => get(r, 'records', []));

    return Promise.all([groups, users]).then(([groups, users]) => [...groups, ...users]);
  };

  fetchAuthority = (dataType, value) => {
    let recordRef = value;

    if (dataType === DataTypes.AUTHORITY) {
      recordRef = getAuthRef(recordRef);
    }

    if (dataType === DataTypes.NODE_REF) {
      recordRef = getRecordRef(recordRef);
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
      const newRecordRef = getPersonRef(recordRef);

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
        recordRef: newRecordRef
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

  addAuthorityGroups = (selectedEntity, authorityGroups) => {
    const promises = selectedEntity.map((entity) => {
      const rec = Records.get(entity.id);
      const recData = rec.load("?json");

      return recData.then(data => {
        const prevAuthorityGroups = data.authorityGroups || [];
        rec.att("authorityGroups", [...prevAuthorityGroups, ...authorityGroups.map(group => group.id)]);

        return rec.save();
      });
    });

    return Promise.all(promises);
  };

  static async fetchGlobalSearchFields() {
    const fields = await ConfigService.getValue(ORGSTRUCT_SEARCH_USER_EXTRA_FIELDS);

    if (!isArray(fields) || !fields[0] || (isString(fields[0]) && !fields[0].trim().length)) {
      return [];
    }

    return fields[0].split(',');
  }

  static async fetchGlobalHideInOrgstruct() {
    const authorityIdsConfigValue = (await ConfigService.getValue(HIDE_IN_ORGSTRUCT)) || [];
    const authorityIds = isString(authorityIdsConfigValue) ? [authorityIdsConfigValue] : authorityIdsConfigValue;
    if (isArray(authorityIds)) {
      return authorityIds
        .join()
        .split(',')
        .filter(id => id && id.length)
        .map(id => id.trim());
    }

    return [];
  }

  static async fetchIsHideDisabledField() {
    return await ConfigService.getValue(ORGSTRUCT_HIDE_DISABLED_USERS);
  }

  static async fetchIsShowDisabledUser() {
    return await ConfigService.getValue(ORGSTRUCT_SHOW_INACTIVE_USER_ONLY_FOR_ADMIN);
  }

  static async fetchUsernameMask() {
    return await ConfigService.getValue(ORGSTRUCT_SHOW_USERNAME_MASK);
  }

  static async fetchIsAdmin() {
    return await Records.get(SourcesId.CURRENT_USER).load('isAdmin?bool');
  }

  static async fetchIsSearchUserMiddleName() {
    return await ConfigService.getValue(ORGSTRUCT_SEARCH_USER_MIDLLE_NAME);
  }

  static getSearchQuery = (search = '', searchFields = DEFAULT_ORGSTRUCTURE_SEARCH_FIELDS) => {
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
    let queryVal = [];

    const notDisabledPredicate = await OrgStructApi.getNotDisabledPredicate();
    if (notDisabledPredicate) {
      queryVal.push(notDisabledPredicate);
    }

    const excludedUsers = await OrgStructApi.fetchGlobalHideInOrgstruct();
    (excludedUsers || []).forEach(item => {
      if (item) {
        queryVal.push({ t: 'not-eq', att: 'id', val: item.replace('GROUP_', '') });
      }
    });

    const searchFields = await OrgStructApi.getSearchFields(searchText, extraFields);

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
      { ...OrgStructApi.userAttributes, ...searchFields, ...extraFields }
    ).then(result => ({
      items: converterUserList(result.records),
      totalCount: result.totalCount
    }));
  }
}
