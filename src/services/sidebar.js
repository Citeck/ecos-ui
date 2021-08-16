import get from 'lodash/get';
import omit from 'lodash/omit';
import cloneDeep from 'lodash/cloneDeep';
import { EventEmitter2 } from 'eventemitter2';
import * as queryString from 'query-string';

import { getJournalPageUrl } from '../helpers/urls';
import { hasChildWithId } from '../helpers/util';
import { isNewVersionPage, NEW_VERSION_PREFIX } from '../helpers/export/urls';
import { treeFindFirstItem, treeFindSuitableItem } from '../helpers/arrayOfObjects';
import { RELOCATED_URL, SourcesId, URL } from '../constants';
import { IGNORE_TABS_HANDLER_ATTR_NAME, REMOTE_TITLE_ATTR_NAME } from '../constants/pageTabs';
import { MenuSettings } from '../constants/menu';
import { ActionTypes, CountableItems } from '../constants/sidebar';
import ULS from './userLocalSettings';

export default class SidebarService {
  static DROPDOWN_LEVEL = 1;
  static SELECTED_MENU_ITEM_ID_KEY = 'selectedMenuItemId';
  static UPDATE_EVENT = 'menu-update-event';

  static emitter = new EventEmitter2();

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

    Object.keys(RELOCATED_URL).forEach(key => {
      if (pathname === RELOCATED_URL[key]) {
        pathname = key;
      }
    });

    if (pathname === URL.JOURNAL) {
      value = SourcesId.JOURNAL + '@' + query.journalId;
      key = 'config.recordRef';
    } else {
      value = queryString.stringifyUrl({ url: pathname, query: omit(query, ['activeLayoutId']) }, { encode: false });
      key = 'config.url';
    }

    const reverse = !value.includes(URL.ADMIN_PAGE);
    const onlyExact = value.includes(URL.DASHBOARD);
    const selected = treeFindSuitableItem(items, key, value, { reverse, onlyExact });

    return get(selected, 'id');
  }

  static isExpanded(expandableItems = [], itemId) {
    return itemId ? !!(expandableItems && (expandableItems.find(fi => fi.id === itemId) || {}).isExpanded) : true;
  }

  static isSelectedChild(expandableItems = [], itemId) {
    return itemId ? !!(expandableItems && (expandableItems.find(fi => fi.id === itemId) || {}).selectedChild) : false;
  }

  static getPropsStyleLevel = ({ level, item }) => {
    const actionType = get(item, 'action.type', '');
    const knownType = Object.values(MITypes).includes(item.type);
    const knownActionType = Object.values(ATypes).includes(actionType);

    const badgeV0 = knownActionType && [ATypes.JOURNAL_LINK].includes(actionType) && CountableItems.includes(get(item, 'params.journalId'));
    const badgeV1 = knownType && [MITypes.JOURNAL].includes(item.type) && get(item, 'config.displayCount');

    const common = {
      noIcon: true,
      noBadge: !(badgeV0 || badgeV1),
      isSeparator: [MITypes.HEADER_DIVIDER].includes(item.type),
      isClosedSeparator: [MITypes.HEADER_DIVIDER].includes(item.type),
      hiddenLabel: get(item, 'config.hiddenLabel')
    };

    const levels = {
      0: {
        ...common,
        noBadge: knownType ? common.noBadge : true,
        isClosedSeparator: knownType ? [MITypes.SECTION, MITypes.HEADER_DIVIDER].includes(item.type) : true
      },
      1: {
        ...common,
        noIcon: [MITypes.HEADER_DIVIDER].includes(item.type)
      }
    };

    return levels[level] || { ...common };
  };

  static getPropsUrl(item, extraParams) {
    let targetUrl = null;
    let attributes = {};
    let ignoreTabHandler = true;

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
          targetUrl = params.url;
          attributes.target = '_blank';
          ignoreTabHandler = params.url.indexOf(NEW_VERSION_PREFIX) !== 0;
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
      case MITypes.JOURNAL:
        if (get(item, 'params.journalId')) {
          targetUrl = getJournalPageUrl({
            journalsListId: get(item, 'params.journalsListId'),
            journalId: get(item, 'params.journalId')
          });
        }
        ignoreTabHandler = false;
        break;
      case MITypes.ARBITRARY:
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

    return {
      targetUrl,
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
const MITypes = MenuSettings.ItemTypes;
