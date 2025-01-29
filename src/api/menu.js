import lodashGet from 'lodash/get';
import lodashSet from 'lodash/set';
import Omit from 'lodash/omit';
import isFunction from 'lodash/isFunction';
import last from 'lodash/last';
import head from 'lodash/head';

import { generateSearchTerm, getCurrentUserName } from '../helpers/util';
import { getWorkspaceId } from '../helpers/urls';
import { SourcesId, URL } from '../constants';
import { ActionTypes } from '../constants/sidebar';
import { CITECK_URI, PROXY_URI, UISERV_API } from '../constants/alfresco';
import { GROUP_EVERYONE, MENU_VERSION, MenuSettings as ms } from '../constants/menu';
import MenuConverter from '../dto/export/menu';
import Records from '../components/Records';
import { AUTHORITY_TYPE_GROUP } from '../components/common/form/SelectOrgstruct/constants';
import { CommonApi } from './common';
import ConfigService, { MAIN_MENU_TYPE, SITE_DASHBOARD_ENABLE, MENU_GROUP_PRIORITY } from '../services/config/ConfigService';
import AuthorityService from '../services/authrority/AuthorityService';
import { PERMISSION_CHANGE_PASSWORD } from '../components/Records/constants';
import { LiveSearchTypes } from '../services/search';

const $4H = 14400000;
const SITE = 'site';
const GLOBAL = 'global';

export const LiveSearchAttributes = {
  ID: 'id',
  DISP: '?disp',
  CREATED: '_created',
  MODIFIED: '_modified',
  GROUP_TYPE: 'groupType',
  TYPE_ID: '_type?id'
};

const PeopleSearchParams = {
  CITY: 'city?str',
  JOB_TITLE: 'jobTitle?str',
  ID: 'id?str',
  LAST_NAME: 'lastName?str',
  FIRST_NAME: 'firstName?str',
  AVATAR: 'avatar.url'
};

const postProcessMenuItemChildren = items => {
  if (items && items.length) {
    return Promise.all(items.map(postProcessMenuConfig));
  }
  return Promise.resolve(items);
};

const postProcessMenuConfig = item => {
  const type = lodashGet(item, 'action.type');
  const journalRef = lodashGet(item, 'action.params.journalRef');
  const siteName = lodashGet(item, 'action.params.siteName');

  const items = postProcessMenuItemChildren(item.items);
  const journalUiType = type === ActionTypes.JOURNAL_LINK && journalRef ? 'react' : '';
  const siteUiType = type === ActionTypes.SITE_LINK && siteName ? MenuApi.getSiteUiType(siteName) : '';

  return Promise.all([items, journalUiType, siteUiType]).then((itemsAndUIType = []) => {
    item.items = itemsAndUIType[0];

    if (itemsAndUIType[1] || itemsAndUIType[2]) {
      item.action.params.uiType = itemsAndUIType[1] || itemsAndUIType[2];
    }

    return item;
  });
};

export class MenuApi extends CommonApi {
  getNewJournalPageUrl = params => {
    let listId = params.listId;
    let siteId = params.siteName;
    let journalRef = params.journalRef || '';

    if (listId) {
      let tokens = listId.split('-');

      if (tokens.length > 1) {
        if (head(tokens) === SITE) {
          siteId = listId.substring(`${SITE}-`.length, listId.length - last(tokens).length - 1);
          listId = last(tokens);
        } else if (head(tokens) === GLOBAL) {
          siteId = null;
          listId = listId.substring(`${GLOBAL}-`.length);
        }
      }
    } else {
      listId = 'main';
    }

    if (siteId) {
      listId = `${SITE}-${siteId}-${listId}`;
    } else {
      listId = `${GLOBAL}-${listId}`;
    }

    return `${URL.JOURNAL}?journalId=${journalRef}&journalSettingId=&journalsListId=${listId}`;
  };

  getMainMenuCreateVariants = (version = MENU_VERSION) => {
    const user = getCurrentUserName();
    const workspaceId = getWorkspaceId();
    const enabledWorkspaces = lodashGet(window, 'Citeck.navigator.WORKSPACES_ENABLED', false);

    return Records.queryOne(
      {
        sourceId: SourcesId.RESOLVED_MENU,
        query: {
          user,
          version,
          ...(enabledWorkspaces && { workspace: workspaceId })
        }
      },
      'subMenu.create?json'
    )
      .then(res =>
        fetchExtraItemInfo(lodashGet(res, 'items') || [], item =>
          lodashGet(item, 'config.variant') ? undefined : { createVariants: 'inhCreateVariants[]?json' }
        )
      )
      .catch(e => {
        console.error(e);
        return [];
      });
  };

  getNewLiveSearch = async text => {
    return await Records.query(
      {
        sourceId: SourcesId.SEARCH,
        query: {
          text,
          types: Object.keys(LiveSearchTypes).map(key => LiveSearchTypes[key]),
          maxItemsForType: 5
        }
      },
      Object.keys(Omit(LiveSearchAttributes, 'ID')).map(key => LiveSearchAttributes[key])
    );
  };

  getSearchPeopleParams = async id => {
    return await Records.get(id).load({
      location: PeopleSearchParams.CITY,
      jobtitle: PeopleSearchParams.JOB_TITLE,
      userName: PeopleSearchParams.ID,
      lastName: PeopleSearchParams.LAST_NAME,
      firstName: PeopleSearchParams.FIRST_NAME,
      avatarUrl: PeopleSearchParams.AVATAR
    });
  };

  getLiveSearchDocuments = (terms, startIndex) => {
    const url = `${PROXY_URI}slingshot/live-search-docs?t=${generateSearchTerm(terms)}&maxResults=5&startIndex=${startIndex}`;
    return this.getJson(url);
  };

  getLiveSearchSites = terms => {
    const url = `${PROXY_URI}slingshot/live-search-sites?t=${generateSearchTerm(terms)}&maxResults=5`;
    return this.getJson(url);
  };

  getLiveSearchPeople = terms => {
    const url = `${PROXY_URI}slingshot/live-search-people?t=${generateSearchTerm(terms)}&maxResults=5`;
    return this.getJson(url);
  };

  getSlideMenuItems = () => {
    const username = getCurrentUserName();
    const cacheKey = Records.get(`${SourcesId.META}@`)
      .load('attributes.menu-cache-key')
      .catch(() => '0');

    return cacheKey
      .then(key =>
        this.getJsonWithSessionCache({
          url: `${UISERV_API}usermenu?username=${username}`,
          cacheKey: key,
          timeout: $4H,
          postProcess: menu => postProcessMenuConfig(menu)
        })
      )
      .catch(() => ({}));
  };

  getMenuItems = async ({ version, id, resolved }) => {
    const enabledWorkspaces = lodashGet(window, 'Citeck.navigator.WORKSPACES_ENABLED', false);
    const user = getCurrentUserName();
    let config;

    const sourceId = resolved === true ? SourcesId.RESOLVED_MENU : SourcesId.MENU;

    if (id) {
      config = await Records.get(`${sourceId}@${id}`).load('subMenu?json', true);
    } else {
      config = await Records.queryOne(
        { sourceId: sourceId, query: { user, version, ...(enabledWorkspaces && { workspace: getWorkspaceId() }) } },
        'subMenu?json'
      );
    }

    return fetchExtraItemInfo(lodashGet(config, 'left.items') || [], {
      label: '.disp',
      journalId: 'id',
      journalRef: 'journalRef?id',
      createVariants: 'inhCreateVariants[]?json![]'
    });
  };

  getMenuItemIconUrl = iconName => {
    return this.getJsonWithSessionCache({
      url: `${CITECK_URI}menu/icon?iconName=${iconName}`,
      timeout: $4H,
      onError: () => null
    });
  };

  getJournalTotalCount = journalId => {
    return Records.get(`${SourcesId.RESOLVED_JOURNAL}@${journalId}`).load('totalCount?num!0');
  };

  getMenuConfig = () => {
    throw new Error('Should be removed');
  };

  /**
   * Getting the configuration of the custom menu (in the header, on the right)
   *
   * @param user
   * @param version
   * @returns {*|RecordsComponent}
   */
  getUserCustomMenuConfig = (user = getCurrentUserName(), version = 1) => {
    const enabledWorkspaces = lodashGet(window, 'Citeck.navigator.WORKSPACES_ENABLED', false);
    const workspaceId = getWorkspaceId();

    return Records.queryOne(
      {
        sourceId: SourcesId.RESOLVED_MENU,
        query: { version, user, ...(enabledWorkspaces && { _workspace: workspaceId }) }
      },
      'subMenu.user?json'
    ).catch(e => {
      console.error(e);
      return {};
    });
  };

  getHasPasswordPermissions = recordRef => {
    return Records.get(recordRef).load(PERMISSION_CHANGE_PASSWORD);
  };

  saveMenuConfig = ({ config = {}, title = '', description = '' }) => {
    throw new Error('Should be removed');
  };

  checkSiteDashboardEnable = () => {
    return ConfigService.getValue(SITE_DASHBOARD_ENABLE);
  };

  getUserMenuConfig = async () => {
    const user = getCurrentUserName();
    const workspace = getWorkspaceId();
    const enabledWorkspaces = lodashGet(window, 'Citeck.navigator.WORKSPACES_ENABLED', false);

    const configVersion = await ConfigService.getValue(MAIN_MENU_TYPE);
    const version = configVersion && configVersion.includes('left-v') ? +configVersion.replace('left-v', '') : 0;
    const id = await Records.queryOne(
      {
        sourceId: SourcesId.MENU,
        query: { user, version, workspace }
      },
      'id'
    ).catch(e => console.error(e));

    return { version, configVersion, id, ...(enabledWorkspaces && { workspace }) };
  };

  getMenuSettingsConfig = async ({ id = '' }) => {
    const config = await Records.get(`${SourcesId.MENU}@${id}`).load(
      {
        id: 'id',
        version: 'version',
        authorities: 'authorities[]?str![]',
        menu: 'subMenu?json'
      },
      true
    );
    const updLeftItems = await fetchExtraItemInfo(lodashGet(config, 'menu.left.items') || [], { label: '.disp' });
    const updCreateItems = await fetchExtraItemInfo(lodashGet(config, 'menu.create.items') || [], { label: '.disp' });
    const updUserMenuItems = await fetchExtraItemInfo(lodashGet(config, 'menu.user.items') || [], { label: '.disp' });
    const updAuthorities = await this.getAuthoritiesInfo(lodashGet(config, 'authorities') || []);

    setSectionTitles(updCreateItems, updLeftItems);
    lodashSet(config, 'menu.left.items', updLeftItems);
    lodashSet(config, 'menu.create.items', updCreateItems);
    lodashSet(config, 'menu.user.items', updUserMenuItems);
    lodashSet(config, 'authorities', updAuthorities);

    return config;
  };

  getItemInfoByRef = records => {
    return Promise.all(
      records.map(recordRef =>
        Records.get(recordRef)
          .load({ label: '.disp', createVariants: 'inhCreateVariants[]' })
          .then(attributes => ({ ...attributes, config: { recordRef } }))
      )
    );
  };

  getAuthoritiesInfo = MenuApi.getAuthoritiesInfo;

  static getAuthoritiesInfo = async (values, attributes = { name: 'authorityName', ref: '?id' }) => {
    return AuthorityService.getAuthorityAttributes(values, attributes);
  };

  getGroupPriority = () => {
    return ConfigService.getValue(MENU_GROUP_PRIORITY);
  };

  getFullGroupPriority = async ({ authorities }) => {
    const localAuthorities = authorities.map(item => item.name);
    const serverAuthorities = await Records.query(
      {
        sourceId: SourcesId.MENU,
        language: 'authorities'
      },
      { name: '.str' }
    )
      .then(res => lodashGet(res, 'records', []).map(r => r.name))
      .catch(_ => []);

    const groupPriority = await this.getGroupPriority();
    const setAuthorities = groupPriority.map(item => item.id);
    const mergeAuthorities = Array.from(new Set([...setAuthorities, ...serverAuthorities, ...localAuthorities]));
    const filteredAuthorities = mergeAuthorities.filter(id => id !== GROUP_EVERYONE && id.includes(AUTHORITY_TYPE_GROUP));

    return fetchExtraGroupItemInfo(filteredAuthorities.map(id => ({ id })));
  };

  saveMenuSettingsConfig = ({ id, subMenu, authorities, version }) => {
    const recordId = id.includes(SourcesId.MENU) ? id : `${SourcesId.MENU}@${id}`;
    const rec = Records.get(recordId);

    !authorities.length && authorities.push(GROUP_EVERYONE);

    rec.att('subMenu?json', subMenu);
    rec.att('authorities[]?str', authorities);
    rec.att('version', version);

    if (lodashGet(window, 'Citeck.navigator.WORKSPACES_ENABLED', false)) {
      rec.att('workspace', getWorkspaceId());
    }

    return rec.save().then(res => {
      Records.get(`${SourcesId.MENU}@${id}`).update();
      Records.get(`${SourcesId.RESOLVED_MENU}@${id}`).update();
      return res;
    });
  };

  saveGroupPriority = ({ groupPriority }) => {
    return ConfigService.setServerValue(MENU_GROUP_PRIORITY, groupPriority);
  };

  removeSettings = ({ id }) => {
    return Records.remove([`${SourcesId.MENU}@${id}`]);
  };
}

async function fetchExtraItemInfo(data = [], attributes) {
  const { JOURNAL, KANBAN, DOCLIB, LINK_CREATE_CASE, EDIT_RECORD, START_WORKFLOW } = ms.ItemTypes;

  return Promise.all(
    data.map(async item => {
      const target = { ...item };
      const iconRef = lodashGet(item, 'icon');
      let attrs = isFunction(attributes) ? attributes(item) : attributes;
      let ref = lodashGet(item, 'config.recordRef') || lodashGet(item, 'config.sectionId') || lodashGet(item, 'config.processDef');

      if (attrs && ref && [JOURNAL, KANBAN, DOCLIB, EDIT_RECORD, START_WORKFLOW].includes(item.type)) {
        ref = ref.replace('/journal@', '/rjournal@');
        ref = ref.replace('/journal_all@', '/rjournal@');
        target._remoteData_ = await Records.get(ref).load(attrs);
      }

      if (item.type === LINK_CREATE_CASE) {
        const variantId = lodashGet(item, 'config.variantId');

        ref = lodashGet(item, 'config.variantTypeRef', '');
        ref = ref.replace(SourcesId.TYPE, SourcesId.RESOLVED_TYPE);

        if (variantId) {
          if (attrs === undefined) {
            attrs = {};
          }
          lodashSet(attrs, 'label', `createVariantsById.${lodashGet(item, 'config.variantId')}.name{ru,en}`);
        }

        target._remoteData_ = await Records.get(ref).load(attrs);
      }

      if (iconRef && iconRef.includes(SourcesId.ICON)) {
        target.icon = await Records.get(iconRef).load({
          url: 'data?str',
          type: 'type',
          value: 'id'
        });
      }

      if (Array.isArray(item.items)) {
        target.items = await fetchExtraItemInfo(item.items, attributes);
      }

      return target;
    })
  );
}

async function fetchExtraGroupItemInfo(data = []) {
  return Promise.all(
    data.map(async item => {
      const target = { ...item };

      if (item.id) {
        target.label = await AuthorityService.getAuthorityAttributes(item.id, '?disp').catch(_ => '');
      }

      return target;
    })
  );
}

function setSectionTitles(createItems, leftItems) {
  const flatSections = MenuConverter.getAllSectionsFlat(leftItems);

  (function processItems(items) {
    items.forEach(item => {
      if (item.type === ms.ItemTypes.CREATE_IN_SECTION) {
        const section = flatSections.find(li => li.id === lodashGet(item, 'config.sectionId')) || {};

        item.label = section.label;
        Array.isArray(item.items) && processItems(item.items);
      }
    });
  })(createItems);
}
