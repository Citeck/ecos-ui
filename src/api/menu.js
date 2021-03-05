import lodashGet from 'lodash/get';
import lodashSet from 'lodash/set';

import { generateSearchTerm, getCurrentUserName, t } from '../helpers/util';
import { SourcesId, URL } from '../constants';
import { ActionTypes } from '../constants/sidebar';
import { PROXY_URI } from '../constants/alfresco';
import { LOWEST_PRIORITY, MenuSettings as ms } from '../constants/menu';
import Records from '../components/Records';
import { AUTHORITY_TYPE_GROUP } from '../components/common/form/SelectOrgstruct/constants';
import { CommonApi } from './common';

const postProcessMenuItemChildren = items => {
  if (items && items.length) {
    return Promise.all(items.map(i => postProcessMenuConfig(i)));
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

  return Promise.all([items, journalUiType, siteUiType]).then(itemsAndUIType => {
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
        if (tokens[0] === 'site') {
          siteId = listId.substring('site-'.length, listId.length - tokens[tokens.length - 1].length - 1);

          listId = tokens[tokens.length - 1];
        } else if (tokens[0] === 'global') {
          siteId = null;

          listId = listId.substring('global-'.length);
        }
      }
    } else {
      listId = 'main';
    }

    if (siteId) {
      listId = 'site-' + siteId + '-' + listId;
    } else {
      listId = 'global-' + listId;
    }

    return `${URL.JOURNAL}?journalId=${journalRef}&journalSettingId=&journalsListId=${listId}`;
  };

  getCreateWorkflowVariants = () => {
    return Promise.resolve([
      {
        id: 'HEADER_CREATE_WORKFLOW',
        label: 'header.create-workflow.label',
        items: [
          {
            id: 'HEADER_CREATE_WORKFLOW_ADHOC',
            label: 'header.create-workflow-adhoc.label',
            control: {
              type: 'ECOS_CREATE_VARIANT',
              payload: {
                formTitle: t('header.create-workflow-adhoc.description'),
                recordRef: 'workflow@def_activiti$perform'
              }
            }
          },
          // TODO: Migration to form required
          {
            id: 'HEADER_CREATE_WORKFLOW_CONFIRM',
            label: 'header.create-workflow-confirm.label',
            targetUrl: '/share/page/start-specified-workflow?workflowId=activiti$confirm'
          }
        ]
      }
    ]);
  };

  getCustomCreateVariants = () => {
    return Records.get(`${SourcesId.CONFIG}@custom-create-buttons`)
      .load('value[]?json', true)
      .then(res => lodashGet(res, '[0]', []))
      .then(res => (Array.isArray(res) ? res : []))
      .catch(() => []);
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
    const cacheKey = Records.get(SourcesId.META + '@')
      .load('attributes.menu-cache-key')
      .catch(() => '0');

    return cacheKey
      .then(key =>
        this.getJsonWithSessionCache({
          url: `/gateway/uiserv/api/usermenu?username=${username}`,
          cacheKey: key,
          timeout: 14400000, //4h
          postProcess: menu => postProcessMenuConfig(menu)
        })
      )
      .catch(() => ({}));
  };

  getMenuItems = async ({ version, id, resolved }) => {
    const user = getCurrentUserName();
    let config;

    const sourceId = resolved === true ? SourcesId.RESOLVED_MENU : SourcesId.MENU;

    if (id) {
      config = await Records.get(`${sourceId}@${id}`).load('subMenu?json', true);
    } else {
      config = await Records.queryOne({ sourceId: sourceId, query: { user, version } }, 'subMenu?json');
    }

    return fetchExtraItemInfo(lodashGet(config, 'left.items') || [], {
      label: '.disp',
      journalId: 'id',
      createVariants: 'inhCreateVariants[]?json'
    });
  };

  getMenuItemIconUrl = iconName => {
    return this.getJsonWithSessionCache({
      url: `${PROXY_URI}citeck/menu/icon?iconName=${iconName}`,
      timeout: 14400000, //4h
      onError: () => null
    });
  };

  getJournalTotalCount = journalId => {
    return Records.get('uiserv/rjournal@' + journalId)
      .load('totalCount?num')
      .then(res => res || 0);
  };

  getMenuConfig = (disabledCache = false) => {
    return Records.get(`${SourcesId.CONFIG}@menu-config`)
      .load('value?json', disabledCache)
      .catch(console.error);
  };

  saveMenuConfig = ({ config = {}, title = '', description = '' }) => {
    const record = Records.get(`${SourcesId.CONFIG}@menu-config`);

    record.att('value?json', config);
    record.att('title', title);
    record.att('description', description);

    return record.save().then(resp => resp);
  };

  checkSiteDashboardEnable = () => {
    return Records.get(`${SourcesId.CONFIG}@site-dashboard-enable`)
      .load('value?bool')
      .then(resp => resp);
  };

  getUserMenuConfig = async () => {
    const user = getCurrentUserName();
    const configVersion = await Records.get(`${SourcesId.ECOS_CONFIG}@default-ui-main-menu`).load('.str');
    const version = configVersion && configVersion.includes('left-v') ? +configVersion.replace('left-v', '') : 0;
    const id = await Records.queryOne({ sourceId: SourcesId.MENU, query: { user, version } }, 'id');

    return { version, configVersion, id };
  };

  getMenuSettingsConfig = async ({ id = '' }) => {
    const config = await Records.get(`${SourcesId.MENU}@${id}`).load(
      {
        id: 'id',
        version: 'version',
        authorities: 'authorities[]?str',
        menu: 'subMenu?json'
      },
      true
    );
    const updItems = await fetchExtraItemInfo(lodashGet(config, 'menu.left.items') || [], { label: '.disp' });
    const filterAuthorities = (lodashGet(config, 'authorities') || []).filter(item => item !== LOWEST_PRIORITY);

    !filterAuthorities.length && filterAuthorities.push(getCurrentUserName());

    const updAuthorities = await this.getAuthoritiesInfoByName(filterAuthorities);

    lodashSet(config, 'menu.left.items', updItems);
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

  getAuthoritiesInfoByName = MenuApi.getAuthoritiesInfoByName;

  static getAuthoritiesInfoByName = (authorities, attributes = { name: '.str', ref: 'nodeRef' }) => {
    const _authorities = authorities.map(auth => `${SourcesId.A_AUTHORITY}@${auth}`);

    return Records.get(_authorities).load(attributes);
  };

  getAuthoritiesInfoByRef = refs => {
    return Records.get(refs).load({ ref: '.str', name: 'cm:userName!cm:authorityName', label: '.disp' });
  };

  getGroupPriority = () => {
    return Records.get(`${SourcesId.CONFIG}@menu-group-priority`).load('value?json');
  };

  getFullGroupPriority = async ({ authorities }) => {
    const localAuthorities = authorities.map(item => item.name);
    const serverAuthorities = await Records.query(
      {
        sourceId: SourcesId.MENU,
        language: 'authorities'
      },
      { name: '.str' }
    ).then(res => res.records.map(r => r.name));

    const groupPriority = await this.getGroupPriority();
    const setAuthorities = (groupPriority || []).map(item => item.id);
    const mergeAuthorities = Array.from(new Set([...setAuthorities, ...serverAuthorities, ...localAuthorities]));
    const filteredAuthorities = mergeAuthorities.filter(id => id !== LOWEST_PRIORITY && id.includes(AUTHORITY_TYPE_GROUP));

    return fetchExtraGroupItemInfo(filteredAuthorities.map(id => ({ id })));
  };

  saveMenuSettingsConfig = ({ id, subMenu, authorities, version }) => {
    const recordId = id.includes(SourcesId.MENU) ? id : `${SourcesId.MENU}@${id}`;
    const rec = Records.get(recordId);

    !authorities.length && authorities.push(LOWEST_PRIORITY);

    rec.att('subMenu', subMenu);
    rec.att('authorities[]?str', authorities);
    rec.att('version', version);

    return rec.save();
  };

  saveGroupPriority = ({ groupPriority }) => {
    const rec = Records.get(`${SourcesId.CONFIG}@menu-group-priority`);
    rec.att('value', groupPriority);
    return rec.save();
  };

  removeSettings = ({ id }) => {
    return Records.remove([`${SourcesId.MENU}@${id}`]);
  };
}

async function fetchExtraItemInfo(data, attributes) {
  return Promise.all(
    data.map(async item => {
      const target = { ...item };
      const iconRef = lodashGet(item, 'icon');
      let journalRef = lodashGet(item, 'config.recordRef');

      if (journalRef && [ms.ItemTypes.JOURNAL, ms.ItemTypes.LINK_CREATE_CASE].includes(item.type)) {
        journalRef = journalRef.replace('/journal@', '/rjournal@');
        journalRef = journalRef.replace('/journal_all@', '/rjournal@');
        target._remoteData_ = await Records.get(journalRef).load(attributes);
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

async function fetchExtraGroupItemInfo(data) {
  return Promise.all(
    data.map(async item => {
      const target = { ...item };

      if (item.id) {
        target.label = await Records.get(`${SourcesId.A_AUTHORITY}@${item.id}`)
          .load('.disp')
          .catch(_ => '');
      }

      return target;
    })
  );
}
