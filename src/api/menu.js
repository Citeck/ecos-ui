import lodashGet from 'lodash/get';
import debounce from 'lodash/debounce';

import { generateSearchTerm, getCurrentUserName } from '../helpers/util';
import { SourcesId, URL } from '../constants';
import { PROXY_URI } from '../constants/alfresco';
import Records from '../components/Records';
import { getJournalUIType } from './export/journalsApi';
import { CommonApi } from './common';
import SidebarService from '../services/sidebar';

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
  const journalUiType = type === SidebarService.ActionTypes.JOURNAL_LINK && journalRef ? getJournalUIType(journalRef) : '';
  const siteUiType = type === SidebarService.ActionTypes.SITE_LINK && siteName ? MenuApi.getSiteUiType(siteName) : '';

  return Promise.all([items, journalUiType, siteUiType]).then(itemsAndUIType => {
    item.items = itemsAndUIType[0];

    if (itemsAndUIType[1] || itemsAndUIType[2]) {
      item.action.params.uiType = itemsAndUIType[1] || itemsAndUIType[2];
    }

    return item;
  });
};

export class MenuApi extends CommonApi {
  static getSiteUiType = siteName => {
    if (!siteName) {
      return Promise.resolve();
    }

    let uiType = MenuApi.uiTypeBySiteName[siteName];

    if (uiType) {
      return uiType.typePromise;
    }

    uiType = {};
    uiType.typePromise = new Promise(resolve => {
      uiType.resolve = resolve;
    });

    MenuApi.uiTypeBySiteName[siteName] = uiType;
    MenuApi.getSiteUiTypes();

    return uiType.typePromise;
  };

  static uiTypeBySiteName = {};

  static getSiteUiTypes = debounce(() => {
    const records = Object.keys(MenuApi.uiTypeBySiteName).map(key => `site@${key}`);

    Records.get(records)
      .load({ id: '.id', type: 'uiType' }, true)
      .then(result => {
        result.forEach(data => {
          MenuApi.uiTypeBySiteName[data.id].resolve(data.type);
        });
      });
  }, 300);

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
                recordRef: 'workflow@def_activiti$perform'
              }
            }
          },
          {
            id: 'HEADER_CREATE_WORKFLOW_CONFIRM',
            label: 'header.create-workflow-confirm.label',
            targetUrl: '/share/page/start-specified-workflow?workflowId=activiti$confirm'
          }
        ]
      }
    ]);
  };

  getCreateVariantsForAllSites = () => {
    const url = `${PROXY_URI}api/journals/create-variants/site/ALL`;
    return this.getJson(url).catch(() => []);
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
    const cacheKey = Records.get('uiserv/meta@')
      .load('attributes.menu-cache-key')
      .catch(() => '0');

    return cacheKey
      .then(key =>
        this.getJsonWithSessionCache({
          url: `${PROXY_URI}citeck/menu/menu?username=${username}`,
          cacheKey: key,
          timeout: 14400000, //4h
          postProcess: menu => postProcessMenuConfig(menu)
        })
      )
      .catch(() => ({}));
  };

  getMenuItemIconUrl = iconName => {
    return this.getJsonWithSessionCache({
      url: `${PROXY_URI}citeck/menu/icon?iconName=${iconName}`,
      timeout: 14400000, //4h
      onError: () => null
    });
  };

  getJournalTotalCount = journalId => {
    //TODO: move this to a menu config
    if (journalId === 'active-tasks' || journalId === 'subordinate-tasks') {
      const url = `${PROXY_URI}api/journals/records/count?journal=${journalId}`;
      return this.getJson(url)
        .then(resp => resp.recordsCount)
        .catch(err => {
          console.error(err);
          return 0;
        });
    } else {
      return Promise.resolve(0);
    }
  };

  getMenuConfig = (disabledCache = false) => {
    return Records.get(`${SourcesId.CONFIG}@menu-config`)
      .load('value?json', disabledCache)
      .then(resp => resp)
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
}
