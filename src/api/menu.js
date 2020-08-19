import lodashGet from 'lodash/get';
import lodashSet from 'lodash/set';

import { generateSearchTerm, getCurrentUserName } from '../helpers/util';
import { SourcesId, URL } from '../constants';
import { PROXY_URI } from '../constants/alfresco';
import { LOWEST_PRIORITY, MenuSettings as ms } from '../constants/menu';
import Records from '../components/Records';
import { AUTHORITY_TYPE_GROUP } from '../components/common/form/SelectOrgstruct/constants';
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

    const allSites = this.getJson(url).catch(() => []);
    const fromJournals = Records.query(
      {
        sourceId: 'uiserv/journal',
        language: 'site-journals'
      },
      {
        createVariants: 'createVariants[]{id,attributes:attributes?json,formRef:formRef?id,name,recordRef:recordRef?id}',
        journalList: 'attributes.journalsListId'
      }
    )
      .then(res => res.records || [])
      .then(records => {
        return records
          .map(r => {
            let listId = r.journalList;
            if (!listId) {
              return {};
            }
            let siteId = listId.substring('site-'.length, listId.length - '-main'.length);
            let variants = (r.createVariants || []).map(v => {
              return {
                canCreate: true,
                formId: v.formRef,
                title: v.name,
                ...v
              };
            });
            return {
              createVariants: variants,
              siteId: siteId
            };
          })
          .filter(r => r.createVariants && r.createVariants.length);
      })
      .catch(e => {
        console.error(e);
        return [];
      });

    return Promise.all([allSites, fromJournals])
      .then(res => {
        const [sitesVariants, journalsVariants] = res;
        for (let journal of journalsVariants) {
          if (!journal.siteId || !journal.createVariants || !journal.createVariants.length) {
            continue;
          }
          let siteForJournal = null;
          for (let site of sitesVariants) {
            if (site.siteId === journal.siteId && !!site.createVariants) {
              siteForJournal = site;
              break;
            }
          }
          if (siteForJournal) {
            siteForJournal.createVariants = siteForJournal.createVariants.concat(journal.createVariants);
          }
        }
        return sitesVariants;
      })
      .catch(e => {
        console.error(e);
        return [];
      });
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

  getMenuItemsByVersion = version => {
    const user = getCurrentUserName();

    return Records.queryOne(
      {
        sourceId: 'uiserv/menu',
        query: { user, version }
      },
      { menu: 'subMenu?json' }
    ).then(resp =>
      fetchExtraItemInfo(lodashGet(resp, 'menu.left.items') || [], {
        label: '.disp',
        journalId: 'id',
        journalsListId: 'journalsListId',
        createVariants: 'createVariants[]?json'
      })
    );
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

  getUserMenuConfig = () => {
    const user = getCurrentUserName();

    const getVer = () =>
      Records.get('ecos-config@default-ui-main-menu')
        .load('.str')
        .then(result => {
          const version = result.replace('left-v', '');

          if (version !== 'left') {
            return +version;
          }
        });

    const getId = version =>
      Records.queryOne(
        {
          sourceId: SourcesId.MENU,
          query: { user, version }
        },
        { id: 'id' },
        {}
      ).then(data => ({ version, ...data }));

    return getVer().then(getId);
  };

  getMenuSettingsConfig = ({ id = '' }) => {
    return Records.get(`${SourcesId.MENU}@${id}`)
      .load(
        {
          id: 'id',
          authorities: 'authorities[]?str',
          menu: 'subMenu?json'
        },
        true
      )
      .then(resp =>
        fetchExtraItemInfo(lodashGet(resp, 'menu.left.items') || [], { label: '.disp' }).then(items => {
          lodashSet(resp, 'menu.left.items', items);
          return resp;
        })
      )
      .then(resp => resp || {})
      .catch(err => {
        console.error(err);
        return {};
      });
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

  getAuthoritiesInfoByName = authorities => {
    const _authorities = authorities.map(auth => `${SourcesId.AUTHORITY}@${auth}`);

    return Records.get(_authorities).load({ name: '.str', ref: 'nodeRef' });
  };

  getAuthoritiesInfoByRef = refs => {
    return Records.get(refs).load({ ref: '.str', name: 'cm:userName!cm:authorityName', label: '.disp' });
  };

  getGroupPriority = ({ authorities }) => {
    const localAuthorities = authorities.map(item => item.name);

    const promiseAuthorities = Records.query(
      {
        sourceId: SourcesId.MENU,
        language: 'authorities'
      },
      { name: '.str' }
    )
      .then(res => res.records.map(r => r.name))
      .then(server => {
        const local = localAuthorities.filter(name => !server.includes(name));
        return server.concat(...local);
      });

    const promiseConfig = Records.get(`${SourcesId.CONFIG}@menu-group-priority`)
      .load('value?json')
      .then(res => res || []);

    return Promise.all([promiseAuthorities, promiseConfig])
      .then(([serverAuthorities, config]) => {
        const setAuthoritiesId = config.map(item => item.id);
        const filteredAvailableAuthorities = serverAuthorities.filter(id => !setAuthoritiesId.includes(id)).map(id => ({ id }));

        return config.concat(...filteredAvailableAuthorities);
      })
      .then(authorities => authorities.filter(item => item.id !== LOWEST_PRIORITY && item.id.includes(AUTHORITY_TYPE_GROUP)))
      .then(fetchExtraGroupItemInfo);
  };

  saveMenuSettingsConfig = ({ id, subMenu, authorities }) => {
    const rec = Records.get(`${SourcesId.MENU}@${id}`);

    rec.att('subMenu', subMenu);
    rec.att('authorities[]?str', authorities);
    rec.att('version', 1);

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
      const journalRef = lodashGet(item, 'config.recordRef');
      const iconRef = lodashGet(item, 'icon');

      if (journalRef && [ms.ItemTypes.JOURNAL, ms.ItemTypes.LINK_CREATE_CASE].includes(item.type)) {
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
        target.label = await Records.get(`${SourcesId.AUTHORITY}@${item.id}`)
          .load('.disp')
          .catch(_ => '');
      }

      return target;
    })
  );
}
