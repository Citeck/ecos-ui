import get from 'lodash/get';
import isArray from 'lodash/isArray';
import isEmpty from 'lodash/isEmpty';
import isString from 'lodash/isString';

import Records from '../components/Records';
import {
  ALFRESCO_ADMINISTRATORS_GROUP,
  AUTHORITY_TYPE_GROUP,
  AUTHORITY_TYPE_ROLE,
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
  getRecordRef,
  getRoleRef
} from '../components/common/form/SelectOrgstruct/helpers';
import { SourcesId, DEFAULT_ORGSTRUCTURE_SEARCH_FIELDS } from '../constants';
import { getEnabledWorkspaces, permute } from '../helpers/util';
import ConfigService, {
  ORGSTRUCT_SEARCH_USER_EXTRA_FIELDS,
  ORGSTRUCT_HIDE_DISABLED_USERS,
  ORGSTRUCT_SEARCH_USER_MIDLLE_NAME,
  ORGSTRUCT_SHOW_USERNAME_MASK,
  ORGSTRUCT_SHOW_INACTIVE_USER_ONLY_FOR_ADMIN,
  HIDE_IN_ORGSTRUCT
} from '../services/config/ConfigService';

import { CommonApi } from './common';

import EcosFormUtils from '@/components/EcosForm/EcosFormUtils/EcosFormUtils';
import { PREDICATE_NOT_EQ, PREDICATE_EQ, PREDICATE_AND } from '@/components/Records/predicates/predicates';
import { getWorkspaceId } from '@/helpers/urls';

export class OrgStructApi extends CommonApi {
  get groupAttributes() {
    return {
      displayName: '?disp',
      firstName: 'firstName',
      lastName: 'lastName',
      authorityName: 'authorityName',
      fullName: 'authorityName',
      groupSubType: 'groupSubType!""',
      isPersonDisabled: 'personDisabled?bool',
      canEdit: 'permissions._has.Write?bool',
      groupType: 'groupType!""',
      email: 'email',
      nodeRef: '?id',
      authorityType: `authorityType!"${AUTHORITY_TYPE_GROUP}"`,
      groups: 'authorityGroups[]?id'
    };
  }

  static get userAttributes() {
    return {
      displayName: '?disp',
      fullName: 'authorityName',
      authorityName: 'authorityName',
      email: 'email',
      isPersonDisabled: 'personDisabled?bool',
      canEdit: 'permissions._has.Write?bool',
      firstName: 'firstName',
      lastName: 'lastName',
      middleName: 'middleName',
      nodeRef: '?id',
      authorityType: `authorityType!"${AUTHORITY_TYPE_USER}"`,
      photo: 'avatar.url',
      groups: 'authorityGroups[]?id'
    };
  }

  static get roleAttributes() {
    return {
      id: '?id',
      nodeRef: '?id',
      label: '?disp',
      authorityName: '?localId',
      displayName: '?disp',
      canEdit: 'permissions._has.Write?bool',
      authorityType: `authorityType!"${AUTHORITY_TYPE_ROLE}"`
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

    const userMask = await OrgStructApi.fetchUsernameMask();
    let personAttributes = {};

    if (!!userMask) {
      personAttributes = EcosFormUtils.getAttrsFromTemplate(userMask).reduce((acc, value) => ({ ...acc, [value]: value }), {});
    }

    const filterByType = items =>
      items.filter(item => {
        if (item.groupType === '') {
          return true;
        }

        return excludeAuthoritiesByType.indexOf(item.groupType) === -1 && excludeAuthoritiesByType.indexOf(item.groupSubType) === -1;
      });

    const searchFields = await OrgStructApi.getSearchFields(searchText);

    let queryVal = searchText
      ? OrgStructApi.getSearchQuery(searchText, searchFields, SourcesId.GROUP)
      : [
          {
            t: 'contains',
            a: 'authorityGroups',
            v: getGroupRef(groupName)
          }
        ];

    let queryValPerson = searchText
      ? OrgStructApi.getSearchQuery(searchText, searchFields, SourcesId.PERSON)
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
      queryValPerson.push(notDisabledPredicate);
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
        queryValPerson.push({ t: 'not-eq', att: 'id', val: item.replace('GROUP_', '') });
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
        query: { t: 'and', v: queryValPerson },
        language: 'predicate'
      },
      { ...OrgStructApi.userAttributes, ...globalSearchConfig, ...personAttributes }
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
    let authorityType;

    switch (true) {
      case recordRef.includes(SourcesId.GROUP):
        authorityType = AUTHORITY_TYPE_GROUP;
        break;

      case recordRef.includes(SourcesId.AUTHORITY):
        authorityType = AUTHORITY_TYPE_ROLE;
        break;

      default:
        authorityType = AUTHORITY_TYPE_USER;
        break;
    }

    if (recordRef.includes(SourcesId.GROUP) || recordRef.includes(SourcesId.PERSON) || recordRef.includes(SourcesId.AUTHORITY)) {
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

    if (recordRef.includes(`${AUTHORITY_TYPE_ROLE}_`)) {
      return {
        recordRef: getRoleRef(getGroupName(recordRef)),
        authorityType: AUTHORITY_TYPE_ROLE
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

    if (authorityType === AUTHORITY_TYPE_ROLE) {
      return Records.get(recordRef).load(OrgStructApi.roleAttributes);
    }

    return Records.get(recordRef).load(this.groupAttributes).then(this._prepareGroups);
  };

  addAuthorityGroups = (selectedEntity, authorityGroups) => {
    const promises = selectedEntity.map(entity => {
      const rec = Records.get(entity.id);
      const recData = rec.load('?json');

      return recData.then(data => {
        const prevAuthorityGroups = data.authorityGroups || [];
        rec.att('authorityGroups', [...prevAuthorityGroups, ...authorityGroups.map(group => group.id)]);

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

  static getSearchQuery = (search = '', searchFields = DEFAULT_ORGSTRUCTURE_SEARCH_FIELDS, sourcesId = '') => {
    const valRaw = search.trim();
    const val = valRaw.split(' ').filter(item => !!item);

    const isEModelPerson = sourcesId === SourcesId.PERSON;

    const searchFieldsTwoWords = ['firstName', 'lastName'];
    const searchFieldsThreeWords = ['firstName', 'lastName', 'middleName'];

    if (isEModelPerson) {
      switch (val.length) {
        case 2:
          searchFields = searchFieldsTwoWords;
          break;
        case 3:
          searchFields = searchFieldsThreeWords;
          break;
        default:
          break;
      }
    }

    const queryVal = [];

    if (isEmpty(val)) {
      return queryVal;
    }

    const generateQuery = (fields, values) => ({
      t: 'or',
      v: values.map(item => ({
        t: 'and',
        v: fields.map((field, index) => ({
          t: 'contains',
          a: field,
          v: item[index]
        }))
      }))
    });

    const singleFieldQuery = (fields, value) => ({
      t: 'or',
      v: fields.map(a => ({
        t: 'contains',
        a,
        v: value
      }))
    });

    const multiFieldQuery = (fields, value) => ({
      t: 'or',
      v: fields.map(a => ({
        t: 'or',
        v: [
          {
            t: 'contains',
            a,
            v: value
          },
          {
            t: 'contains',
            a,
            v: value.split(' ').reverse().join(' ')
          }
        ]
      }))
    });

    if (isEModelPerson) {
      let query;

      switch (val.length) {
        case 0:
          return [];
        case 1:
          queryVal.push(singleFieldQuery(searchFields, val[0])); // search by originSearchFields for a single word
          break;
        case 2:
          query = generateQuery(searchFields, permute(val)); // sorting through all the variants of the surname + the first name of two words

          if (get(query, 'v') && isArray(query.v)) {
            query.v.push(singleFieldQuery(searchFieldsThreeWords, val.join(' '))); // two words are completely one field of full name

            query.v.push(generateQuery(['firstName', 'middleName'], permute(val))); // search by name + patronymic
            query.v.push(generateQuery(['lastName', 'middleName'], permute(val))); // search by last name + patronymic
          }

          queryVal.push(query);
          break;
        case 3:
          const firstSimilarOptions = [[val[0], val[1]].join(' '), val[2]];
          const secSimilarOptions = [[val[1], val[2]].join(' '), val[0]];

          query = generateQuery(searchFields, permute(val)); // sorting through all three-word full name options

          if (get(query, 'v') && isArray(query.v)) {
            query.v.push(singleFieldQuery(searchFieldsThreeWords, val.join(' '))); // three words is completely one field of full name

            // two words standing next to each other out of three are completely one field of full name
            [
              ['firstName', 'middleName'],
              ['lastName', 'middleName'],
              ['lastName', 'firstName']
            ].forEach(fields => {
              query.v.push(generateQuery(fields, permute(firstSimilarOptions)));
              query.v.push(generateQuery(fields, permute(secSimilarOptions)));
            });
          }

          queryVal.push(query);
          break;
        default:
          queryVal.push(multiFieldQuery(searchFields, val.join(' '))); // search for originSearchFields from 4 words (inclusive) and more
          break;
      }
    } else {
      switch (val.length) {
        case 0:
          return [];
        case 1:
          queryVal.push(singleFieldQuery(searchFields, val[0]));
          break;
        default:
          queryVal.push(multiFieldQuery(searchFields, val.join(' ')));
          break;
      }
    }

    return queryVal;
  };

  static async getRoleList(searchText, extraFields = []) {
    return Records.query(
      {
        sourceId: SourcesId.AUTHORITY,
        query: { types: ['ROLE'] }
      },
      { ...OrgStructApi.roleAttributes, ...extraFields }
    );
  }

  static async getUserList(searchText, extraFields = [], params = { page: 0, maxItems: ITEMS_PER_PAGE }, isSkipSearchInWorkspace) {
    let queryVal = [];

    const notDisabledPredicate = await OrgStructApi.getNotDisabledPredicate();
    if (notDisabledPredicate) {
      queryVal.push(notDisabledPredicate);
    }

    const excludedUsers = await OrgStructApi.fetchGlobalHideInOrgstruct();
    (excludedUsers || []).forEach(item => {
      if (item) {
        queryVal.push({ t: PREDICATE_NOT_EQ, att: 'id', val: item.replace('GROUP_', '') });
      }
    });

    if (getEnabledWorkspaces() && !isSkipSearchInWorkspace) {
      queryVal.push({
        t: PREDICATE_EQ,
        att: '_workspace',
        val: getWorkspaceId()
      });
    }

    const searchFields = await OrgStructApi.getSearchFields(searchText, extraFields);

    queryVal = queryVal.concat(OrgStructApi.getSearchQuery(searchText, searchFields, SourcesId.PERSON));

    return Records.query(
      {
        sourceId: SourcesId.PERSON,
        query: { t: PREDICATE_AND, v: queryVal },
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
