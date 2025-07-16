import { EventEmitter } from 'events';
import cloneDeep from 'lodash/cloneDeep';
import get from 'lodash/get';
import omit from 'lodash/omit';
import * as queryString from 'query-string';

import { isKanban, JOURNAL_VIEW_MODE } from '../components/Journals/constants';
import { RELOCATED_URL, SourcesId, URL, URL_MATCHING } from '../constants';
import { MenuSettings } from '../constants/menu';
import { IGNORE_TABS_HANDLER_ATTR_NAME, REMOTE_TITLE_ATTR_NAME } from '../constants/pageTabs';
import { ActionTypes, CountableItems } from '../constants/sidebar';
import { treeFindFirstItem } from '../helpers/arrayOfObjects';
import { isNewVersionPage, NEW_VERSION_PREFIX } from '../helpers/export/urls';
import { getCustomDasboardUrl, getJournalPageUrl, getLinkWithWs, getWikiDasboardUrl, getWorkspaceId } from '../helpers/urls';
import { arrayFlat, getEnabledWorkspaces, hasChildWithId } from '../helpers/util';

import ULS from './userLocalSettings';

export default class SidebarService {
  static DROPDOWN_LEVEL = 1;
  static SELECTED_MENU_ITEM_ID_KEY = 'selectedMenuItemId';
  static UPDATE_EVENT = 'menu-update-event';

  static emitter = new EventEmitter();

  static getOpenState() {
    // Cause: https://citeck.atlassian.net/browse/ECOSUI-354
    if (!isNewVersionPage()) {
      return false;
    }

    return get(ULS.getMenuMode(), 'isSlideMenuOpen', true);
  }

  static setOpenState(isSlideMenuOpen) {
    // Cause: https://citeck.atlassian.net/browse/ECOSUI-354
    if (!isNewVersionPage()) {
      return;
    }

    ULS.setMenuMode({ isSlideMenuOpen });
  }

  static getSelectedId(items) {
    let { pathname, search } = window.location;
    const query = queryString.parse(search);

    let value, key;

    if (pathname === URL.JOURNAL && !isKanban(get(query, 'viewMode'))) {
      value = SourcesId.JOURNAL + '@' + query.journalId;
      key = 'config.recordRef';
    } else {
      value = queryString.stringifyUrl({ url: pathname, query: omit(query, ['activeLayoutId']) }, { encode: false });
      key = 'config.url';
    }

    const [baseUrl, queryStringValue] = value.split('?');

    if (queryStringValue && getEnabledWorkspaces()) {
      const params = queryStringValue
        .split('&')
        .filter(param => !param.startsWith('ws='))
        .join('&');

      value = params ? `${baseUrl}?${params}` : baseUrl;
    }

    const reverse = !value.includes(URL.ADMIN_PAGE);
    const onlyExact = value.includes(URL.DASHBOARD);

    const selected = SidebarService.treeFindSuitableItem(items, key, value, { reverse, onlyExact });

    return get(selected, 'id');
  }

  /**
   * If there is exact in array, it'll return exact item, else suitable item or undefined
   * @param items {Array} data array
   * @param key {String} key path field
   * @param value {String} compared value
   * @param props {Object} props: reverse - reverse comparison value with
   * @return {Object | undefined} found item
   */
  static treeFindSuitableItem(items = [], key, value, props) {
    const reverse = get(props, 'reverse', false);
    const onlyExact = get(props, 'onlyExact', false);
    const flatArray = arrayFlat({ data: cloneDeep(items), byField: 'items', withParent: true });

    let exact, suitable;

    for (let item of flatArray) {
      let { targetUrl } = SidebarService.getPropsUrl(item);

      if (!targetUrl) {
        targetUrl = get(item, key);
      }

      if (targetUrl && value.includes('$') && targetUrl.includes('%24')) {
        targetUrl = targetUrl.replace(/%24/g, '$'); // Removing the character encoding $
      }

      if (getEnabledWorkspaces() && targetUrl && targetUrl.includes('ws=')) {
        const [baseUrl, queryString] = targetUrl.split('?');

        if (queryString) {
          const params = queryString
            .split('&')
            .filter(param => !param.startsWith('ws='))
            .join('&');

          targetUrl = params ? `${baseUrl}?${params}` : baseUrl;
        }
      }

      const _exact = targetUrl === value || value === URL_MATCHING[targetUrl];
      if (_exact) {
        exact = item;
        break;
      }

      if (String(value) === get(item, key)) {
        exact = item;
        break;
      }

      const _suitable = reverse ? String(value).includes(get(item, key)) : String(get(item, key)).includes(value);
      if ((!onlyExact && _suitable) || value.includes(URL_MATCHING[targetUrl])) {
        suitable = item;
      }
    }

    return exact || suitable;
  }

  static isExpanded(expandableItems = [], itemId) {
    return itemId ? !!(expandableItems && (expandableItems.find(fi => fi.id === itemId) || {}).isExpanded) : true;
  }

  static isSelectedChild(expandableItems = [], itemId) {
    return itemId ? !!(expandableItems && (expandableItems.find(fi => fi.id === itemId) || {}).selectedChild) : false;
  }

  static getPropsStyleLevel = ({ level, item }) => {
    const actionType = get(item, 'action.type', '');
    const knownType = Object.values(MenuItemsTypes).includes(item.type);
    const knownActionType = Object.values(ATypes).includes(actionType);

    const badgeV0 = knownActionType && [ATypes.JOURNAL_LINK].includes(actionType) && CountableItems.includes(get(item, 'params.journalId'));
    const badgeV1 = knownType && [MenuItemsTypes.JOURNAL].includes(item.type) && get(item, 'config.displayCount');

    const common = {
      noIcon: true,
      noBadge: !(badgeV0 || badgeV1),
      isSeparator: [MenuItemsTypes.HEADER_DIVIDER].includes(item.type),
      isClosedSeparator: [MenuItemsTypes.HEADER_DIVIDER].includes(item.type),
      hiddenLabel: get(item, 'config.hiddenLabel')
    };

    const levels = {
      0: {
        ...common,
        noBadge: knownType ? common.noBadge : true,
        isClosedSeparator: knownType ? [MenuItemsTypes.SECTION, MenuItemsTypes.HEADER_DIVIDER].includes(item.type) : true
      },
      1: {
        ...common,
        noIcon: [MenuItemsTypes.HEADER_DIVIDER].includes(item.type)
      }
    };

    return levels[level] || { ...common };
  };

  static getPropsUrl(item, extraParams) {
    let targetUrl = null;
    let attributes = {};
    let ignoreTabHandler = true;

    const workspaceEnabled = getEnabledWorkspaces();

    /** @deprecated since menu v1 */
    if (item.action) {
      const params = item.action.params || {};

      switch (item.action.type) {
        case ATypes.FILTER_LINK:
        case ATypes.JOURNAL_LINK:
          {
            let listId = params.listId || 'tasks';

            if (params.siteName) {
              listId = params.listId || 'main';
            }

            targetUrl = getJournalPageUrl({
              journalsListId: params.siteName ? `site-${params.siteName}-${listId}` : `global-${listId}`,
              journalId: params.journalRef,
              journalSettingId: '', // TODO?
              nodeRef: params.journalRef,
              filter: params.filterRef
            });

            ignoreTabHandler = false;
            attributes.rel = 'noopener noreferrer';
          }
          break;
        case ATypes.SITE_LINK:
          ignoreTabHandler = false;
          attributes.rel = 'noopener noreferrer';

          if (!extraParams.isSiteDashboardEnable && Array.isArray(item.items) && item.items.length > 0) {
            const journalLink = item.items.find(item => {
              return item.action.type === 'JOURNAL_LINK';
            });

            if (journalLink) {
              const params = journalLink.action.params;
              let listId = 'tasks';
              if (params.siteName) {
                listId = params.listId || 'main';
              }
              targetUrl = getJournalPageUrl({
                journalsListId: params.siteName ? `site-${params.siteName}-${listId}` : `global-${listId}`,
                journalId: params.journalRef,
                journalSettingId: '', // TODO?
                nodeRef: params.journalRef,
                filter: params.filterRef
              });
              break;
            }
          }

          attributes[REMOTE_TITLE_ATTR_NAME] = true;
          targetUrl = `${URL.DASHBOARD}?recordRef=site@${params.siteName}`;
          break;
        case ATypes.STATIC_LINK: {
          targetUrl = params.url || '';
          attributes.target = '_blank';
          ignoreTabHandler = targetUrl.indexOf(NEW_VERSION_PREFIX) !== 0;
          break;
        }
        default:
          break;
      }

      switch (params.pageId) {
        case 'bpmn-designer':
          let sectionPostfix = params.section ? params.section : '';

          targetUrl = `${NEW_VERSION_PREFIX}/${params.pageId}${sectionPostfix}`;
          ignoreTabHandler = false;
          attributes.rel = 'noopener noreferrer';
          break;
        default:
          break;
      }
    }

    switch (item.type) {
      case MenuItemsTypes.DASHBOARD:
        if (get(item, 'config.dashboardId')) {
          targetUrl = getCustomDasboardUrl(get(item, 'config.dashboardId'));
        }
        ignoreTabHandler = false;
        break;
      case MenuItemsTypes.KANBAN:
        if (get(item, 'params.journalId')) {
          let kanbanParams = {
            journalsListId: get(item, 'params.journalsListId'),
            journalId: get(item, 'params.journalId'),
            viewMode: JOURNAL_VIEW_MODE.KANBAN
          };

          const boardId = get(item, 'config.recordRef', '');

          if (boardId) {
            kanbanParams = { ...kanbanParams, boardId: boardId };
          }

          targetUrl = getJournalPageUrl(kanbanParams);
        }
        ignoreTabHandler = false;
        break;
      case MenuItemsTypes.WIKI:
        targetUrl = getWikiDasboardUrl();
        ignoreTabHandler = false;
        break;
      case MenuItemsTypes.DOCLIB:
        if (get(item, 'params.journalId')) {
          targetUrl = getJournalPageUrl({
            journalsListId: get(item, 'params.journalsListId'),
            journalId: get(item, 'params.journalId'),
            viewMode: JOURNAL_VIEW_MODE.DOC_LIB
          });
        }
        ignoreTabHandler = false;
        break;
      case MenuItemsTypes.PREVIEW_LIST:
        if (get(item, 'params.journalId')) {
          targetUrl = getJournalPageUrl({
            journalsListId: get(item, 'params.journalsListId'),
            journalId: get(item, 'params.journalId'),
            viewMode: JOURNAL_VIEW_MODE.PREVIEW_LIST
          });
        }
        ignoreTabHandler = false;
        break;
      case MenuItemsTypes.JOURNAL:
        if (get(item, 'params.journalId')) {
          targetUrl = getJournalPageUrl({
            journalsListId: get(item, 'params.journalsListId'),
            journalId: get(item, 'params.journalId')
          });
        }
        ignoreTabHandler = false;
        break;
      case MenuItemsTypes.ARBITRARY:
        targetUrl = get(item, 'config.url', null);

        if (targetUrl && targetUrl.includes('http')) {
          attributes.target = '_blank';
          attributes.rel = 'noopener noreferrer';
        } else {
          ignoreTabHandler = false;
        }
        break;
      default:
        break;
    }

    if (ignoreTabHandler) {
      attributes[IGNORE_TABS_HANDLER_ATTR_NAME] = true;
    }

    const workspaceId = getWorkspaceId();
    const hasRedirects = Object.keys(RELOCATED_URL).some(key => targetUrl && targetUrl.includes(key));
    const hasWorkspaceInLink = workspaceEnabled && targetUrl && targetUrl.includes('ws=');

    if (hasWorkspaceInLink) {
      attributes.target = '_self';
      attributes[IGNORE_TABS_HANDLER_ATTR_NAME] = false;
    }

    return {
      targetUrl: workspaceId && targetUrl && workspaceEnabled && !hasWorkspaceInLink && !hasRedirects ? getLinkWithWs(targetUrl, workspaceId) : targetUrl,
      attributes
    };
  }

  static initExpandableItems(items, selectedId, isSlideMenuOpen) {
    let flatList = [];

    items.forEach(item => {
      if (!!item.items) {
        const selectedChild = hasChildWithId(item.items, selectedId);
        const isExpanded = isSlideMenuOpen && (selectedChild || (item.params.collapsible ? !item.params.collapsed : true));

        flatList.push(
          {
            id: item.id,
            isExpanded,
            selectedChild
          },
          ...SidebarService.initExpandableItems(item.items, selectedId, isSlideMenuOpen)
        );
      }
    });

    return flatList;
  }

  static getExpandableItems(expandableItems, items, id) {
    const exItems = cloneDeep(expandableItems);

    exItems.forEach(item => {
      const _item = treeFindFirstItem({ items, key: 'id', value: item.id }) || {};
      item.selectedChild = hasChildWithId(_item.items, id);
    });

    return exItems;
  }

  static emit(event, callback) {
    SidebarService.emitter.emit(event, callback);
  }

  static addListener(event, callback) {
    SidebarService.emitter.on(event, callback);
  }

  static removeListener(event, callback) {
    SidebarService.emitter.off(event, callback);
  }
}

const ATypes = ActionTypes;
const MenuItemsTypes = MenuSettings.ItemTypes;
