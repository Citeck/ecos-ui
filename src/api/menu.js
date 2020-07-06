import lodashGet from 'lodash/get';
import lodashSet from 'lodash/set';

import { generateSearchTerm, getCurrentUserName } from '../helpers/util';
import { SourcesId, URL } from '../constants';
import { PROXY_URI } from '../constants/alfresco';
import { MenuSettings as ms } from '../constants/menu';
import Records from '../components/Records';
import { getJournalUIType } from './export/journalsApi';
import { CommonApi } from './common';

const postProcessMenuItemChildren = items => {
  if (items && items.length) {
    return Promise.all(items.map(i => postProcessMenuConfig(i)));
  }
  return Promise.resolve(items);
};

const postProcessMenuConfig = item => {
  let journalRef = lodashGet(item, 'action.params.journalRef');

  let items = postProcessMenuItemChildren(item.items);
  let uiType = journalRef ? getJournalUIType(journalRef) : '';

  return Promise.all([items, uiType]).then(itemsAndUIType => {
    item.items = itemsAndUIType[0];
    if (itemsAndUIType[1]) {
      item.action.params.uiType = itemsAndUIType[1];
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

  getMenuSettingsConfig = ({ id }) => {
    return Records.get(`${SourcesId.MENU}@${id}`)
      .load(
        {
          id: 'id',
          authorities: 'authorities[]?str',
          menu: 'subMenu?json'
        },
        true
      )
      .then(resp => {
        return fetchExtraItemInfo(lodashGet(resp, 'menu.left.items') || []).then(items => {
          lodashSet(resp, 'menu.left.items', items);
          return resp;
        });
      })
      .then(resp => resp)
      .catch(err => {
        console.error(err);
        return {};
      });
  };

  saveMenuSettingsConfig = ({ id, subMenu, authorities }) => {
    const rec = Records.get(`${SourcesId.MENU}@${id}`);

    rec.att('subMenu', subMenu);
    rec.att('authorities[]?str', authorities);

    return rec.save();
  };

  getItemInfoByRef = records => {
    return Promise.all(
      records.map(recordRef =>
        Records.get(recordRef)
          .load({ label: '.disp' })
          .then(attributes => ({ ...attributes, config: { recordRef } }))
      )
    );
  };
}

async function fetchExtraItemInfo(data) {
  return Promise.all(
    data.map(async item => {
      const target = { ...item };
      const journalRef = lodashGet(item, 'config.recordRef');
      const iconRef = lodashGet(item, 'icon');

      if (journalRef && [ms.ItemTypes.JOURNAL].includes(item.type)) {
        const result = await Records.get(journalRef).load({
          label: '.disp'
          //id: 'id',
          //count: 'count', //todo wait new api for actual
        });

        target.label = result.label;
        target.config = { ...target.config, count: 0 };
      }

      if (iconRef && iconRef.includes(SourcesId.ICON)) {
        const icon = await Records.get(iconRef).load({
          url: 'data?str',
          type: 'type',
          value: 'id'
        });

        target.icon = { ...target.icon, ...icon };
      }

      if (Array.isArray(item.items)) {
        target.items = await fetchExtraItemInfo(item.items);
      }

      return target;
    })
  );
}
