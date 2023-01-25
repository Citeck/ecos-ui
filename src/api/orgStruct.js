import * as queryString from 'query-string';

import { DataTypes, ITEMS_PER_PAGE } from '../components/common/form/SelectOrgstruct/constants';
import Records from '../components/Records';
import { SourcesId, DEFAULT_ORGSTRUCTURE_SEARCH_FIELDS } from '../constants';
import { PROXY_URI } from '../constants/alfresco';
import { converterUserList } from '../components/common/form/SelectOrgstruct/helpers';
import { getCurrentUserName, isNodeRef } from '../helpers/util';
import { CommonApi } from './common';

export class OrgStructApi extends CommonApi {
  _loadedAuthorities = {};
  _loadedGroups = {};

  getUsers = async (searchText = '') => {
    const useMiddleName = await OrgStructApi.fetchIsSearchUserMiddleName();
    const searchExtraFields = await OrgStructApi.fetchGlobalSearchFields();

    let url = queryString.stringifyUrl(
      {
        url: `${PROXY_URI}api/orgstruct/v2/group/_orgstruct_home_/children?branch=false&role=false`,
        query: {
          user: true,
          recurse: true,
          excludeAuthorities: 'all_users',
          useMiddleName,
          searchExtraFields,
          group: false
        }
      },
      { arrayFormat: 'comma' }
    );

    if (searchText.length > 0) {
      url += `&filter=${encodeURI(searchText)}`;
    }

    return this.getJson(url).catch(() => []);
  };

  fetchGroup = async ({ query, excludeAuthoritiesByName = '', excludeAuthoritiesByType = [], isIncludedAdminGroup }) => {
    excludeAuthoritiesByName = excludeAuthoritiesByName
      .split(',')
      .map(item => item.trim())
      .join(',');

    const queryStr = JSON.stringify({ query, excludeAuthoritiesByName, excludeAuthoritiesByType, isIncludedAdminGroup });

    if (this._loadedGroups[queryStr]) {
      return Promise.resolve(this._loadedGroups[queryStr]);
    }

    const { groupName, searchText } = query;
    const urlQuery = { excludeAuthorities: excludeAuthoritiesByName, addAdminGroup: !!isIncludedAdminGroup };

    if (searchText) {
      urlQuery.filter = searchText;
      urlQuery.recurse = true;
      urlQuery.useMiddleName = await OrgStructApi.fetchIsSearchUserMiddleName();
      urlQuery.searchExtraFields = await OrgStructApi.fetchGlobalSearchFields();
      urlQuery.user = true;
    }

    const url = queryString.stringifyUrl(
      {
        url: `${PROXY_URI}api/orgstruct/v2/group/${groupName}/children?branch=true&role=true&group=true`,
        query: urlQuery
      },
      { arrayFormat: 'comma' }
    );

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

  static async fetchGlobalSearchFields() {
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

  static async fetchGlobalHideInOrgstruct() {
    return Records.get(`${SourcesId.ECOS_CONFIG}@hide-in-orgstruct`)
      .load('?str')
      .then(config => {
        if (typeof config !== 'string' || !config.trim().length) {
          return [];
        }

        return config.split(',');
      })
      .catch(() => []);
  }

  static async fetchIsHideDisabledField() {
    try {
      const result = await Records.get('ecos-config@hide-disabled-users-for-everyone').load('.bool');

      return Boolean(result);
    } catch {
      return false;
    }
  }

  static async fetchIsAdmin(userName) {
    try {
      const result = await Records.get(`${SourcesId.PEOPLE}@${userName}`).load('isAdmin?bool');

      return Boolean(result);
    } catch {
      return false;
    }
  }

  static async fetchIsSearchUserMiddleName() {
    try {
      const result = await Records.get(`${SourcesId.CONFIG}@orgstruct-search-user-middle-name`).load('value');

      return Boolean(result);
    } catch {
      return false;
    }
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

    const isHideForAll = await OrgStructApi.fetchIsHideDisabledField();

    if (isHideForAll) {
      queryVal.push(predicateNotDisabled);
    } else {
      const isAdmin = await OrgStructApi.fetchIsAdmin(getCurrentUserName());

      if (!isAdmin) {
        const showInactiveUserOnlyForAdmin = Boolean(
          await Records.get('ecos-config@orgstruct-show-inactive-user-only-for-admin').load('.bool')
        );

        if (showInactiveUserOnlyForAdmin) {
          queryVal.push(predicateNotDisabled);
        }
      }
    }

    ((await OrgStructApi.fetchGlobalHideInOrgstruct()) || []).forEach(item => {
      if (item && !item.startsWith('GROUP_')) {
        queryVal.push({ t: 'not-eq', att: 'cm:userName', val: item });
      }
    });

    const attributes = {
      fullName: '.disp',
      userName: 'userName',
      personDisabled: 'ecos:isPersonDisabled?bool'
    };

    if (searchText) {
      const searchFields = DEFAULT_ORGSTRUCTURE_SEARCH_FIELDS;

      const isSearchUserMiddleName = await OrgStructApi.fetchIsSearchUserMiddleName();

      if (val.length === 2) {
        if (isSearchUserMiddleName) {
          const lastFirst = [
            {
              t: 'and',
              val: [
                {
                  t: 'contains',
                  att: 'cm:lastName',
                  val: val[0]
                },
                {
                  t: 'contains',
                  att: 'cm:middleName',
                  val: val[1]
                }
              ]
            },
            {
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
            },
            {
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
            },
            {
              t: 'and',
              val: [
                {
                  t: 'contains',
                  att: 'cm:middleName',
                  val: val[0]
                },
                {
                  t: 'contains',
                  att: 'cm:lastName',
                  val: val[1]
                }
              ]
            }
          ];

          const firstLast = [
            {
              t: 'and',
              val: [
                {
                  t: 'contains',
                  att: 'cm:firstName',
                  val: val[0]
                },
                {
                  t: 'contains',
                  att: 'cm:middleName',
                  val: val[1]
                }
              ]
            },
            {
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
            },
            {
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
            },
            {
              t: 'and',
              val: [
                {
                  t: 'contains',
                  att: 'cm:middleName',
                  val: val[0]
                },
                {
                  t: 'contains',
                  att: 'cm:firstName',
                  val: val[1]
                }
              ]
            }
          ];

          queryVal.push({
            t: 'or',
            val: [...lastFirst, ...firstLast]
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
            val: [lastFirst, firstLast]
          });
        }
      } else if (val.length === 3) {
        if (isSearchUserMiddleName) {
          const lastFirst = [
            {
              t: 'and',
              val: [
                {
                  t: 'contains',
                  att: 'cm:lastName',
                  val: val[0]
                },
                {
                  t: 'contains',
                  att: 'cm:middleName',
                  val: val[1]
                },
                {
                  t: 'contains',
                  att: 'cm:firstName',
                  val: val[2]
                }
              ]
            },
            {
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
                },
                {
                  t: 'contains',
                  att: 'cm:middleName',
                  val: val[2]
                }
              ]
            }
          ];

          const firstLast = [
            {
              t: 'and',
              val: [
                {
                  t: 'contains',
                  att: 'cm:firstName',
                  val: val[0]
                },
                {
                  t: 'contains',
                  att: 'cm:middleName',
                  val: val[1]
                },
                {
                  t: 'contains',
                  att: 'cm:lastName',
                  val: val[2]
                }
              ]
            },
            {
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
                },
                {
                  t: 'contains',
                  att: 'cm:middleName',
                  val: val[2]
                }
              ]
            }
          ];

          const middleLast = [
            {
              t: 'and',
              val: [
                {
                  t: 'contains',
                  att: 'cm:middleName',
                  val: val[0]
                },
                {
                  t: 'contains',
                  att: 'cm:firstName',
                  val: val[1]
                },
                {
                  t: 'contains',
                  att: 'cm:lastName',
                  val: val[2]
                }
              ]
            },
            {
              t: 'and',
              val: [
                {
                  t: 'contains',
                  att: 'cm:middleName',
                  val: val[0]
                },
                {
                  t: 'contains',
                  att: 'cm:lastName',
                  val: val[1]
                },
                {
                  t: 'contains',
                  att: 'cm:firstName',
                  val: val[2]
                }
              ]
            }
          ];

          queryVal.push({
            t: 'or',
            val: [...lastFirst, ...middleLast, ...firstLast]
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
      } else {
        const globalSearchConfig = await OrgStructApi.fetchGlobalSearchFields();

        const addExtraFields = (fields = []) => {
          const attributes = fields.map(field => field.trim());

          searchFields.push(...attributes.filter(att => !searchFields.includes(att)));
        };

        if (Array.isArray(globalSearchConfig) && globalSearchConfig.length > 0) {
          addExtraFields(globalSearchConfig);
        }

        if (Array.isArray(extraFields) && extraFields.length > 0) {
          addExtraFields(extraFields);
        }

        if (isSearchUserMiddleName) {
          addExtraFields(['middleName']);
        }

        queryVal.push({
          t: 'or',
          val: searchFields.map(att => ({
            t: 'contains',
            att: att,
            val: val[0]
          }))
        });
      }

      if (Array.isArray(searchFields) && searchFields.length > 0) {
        searchFields.forEach(attribute => {
          attributes[attribute] = attribute;
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
        ...attributes
      }
    ).then(result => ({
      items: converterUserList(result.records),
      totalCount: result.totalCount
    }));
  }
}
