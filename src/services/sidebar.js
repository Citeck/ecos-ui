import get from 'lodash/get';

import { getJournalPageUrl } from '../helpers/urls';
import { getSessionData, setSessionData } from '../helpers/ls';
import { hasChildWithId } from '../helpers/util';
import { isNewVersionPage, NEW_VERSION_PREFIX } from '../helpers/export/urls';
import { URL } from '../constants';
import { IGNORE_TABS_HANDLER_ATTR_NAME, REMOTE_TITLE_ATTR_NAME } from '../constants/pageTabs';
import { MenuSettings } from '../constants/menu';
import ULS from './userLocalSettings';

export default class SidebarService {
  static ActionTypes = {
    CREATE_SITE: 'CREATE_SITE',
    FILTER_LINK: 'FILTER_LINK',
    JOURNAL_LINK: 'JOURNAL_LINK',
    PAGE_LINK: 'PAGE_LINK',
    SITE_LINK: 'SITE_LINK'
  };

  static DROPDOWN_LEVEL = 1;
  static SELECTED_MENU_ITEM_ID_KEY = 'selectedMenuItemId';

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

  static getSelected() {
    return getSessionData(SidebarService.SELECTED_MENU_ITEM_ID_KEY);
  }

  static setSelected(value) {
    setSessionData(SidebarService.SELECTED_MENU_ITEM_ID_KEY, value);
  }

  static isExpanded(expandableItems = [], itemId) {
    return itemId ? !!(expandableItems && (expandableItems.find(fi => fi.id === itemId) || {}).isNestedListExpanded) : true;
  }

  static isSelectedChild(expandableItems = [], itemId) {
    return itemId ? !!(expandableItems && (expandableItems.find(fi => fi.id === itemId) || {}).selectedChild) : false;
  }

  static getPropsStyleLevel = ({ level, actionType, itemType, config }) => {
    const knownType = Object.values(MITypes).includes(itemType);
    const knownActionType = Object.values(ATypes).includes(actionType);

    const common = {
      noIcon: true,
      noBadge: !(
        (knownActionType && ![ATypes.CREATE_SITE].includes(actionType)) ||
        (knownType && [MITypes.JOURNAL, MITypes.LINK_CREATE_CASE].includes(itemType) && config.displayCount)
      ),
      isSeparator: knownType && [MITypes.HEADER_DIVIDER, MITypes.SECTION].includes(itemType)
    };

    const levels = {
      0: {
        ...common,
        noBadge: knownType ? common.noBadge : true,
        isSeparator: knownType ? common.isSeparator : true
      },
      1: {
        ...common,
        noIcon: false
      }
    };

    return levels[level] || { ...common };
  };

  static getPropsUrl(item, extraParams) {
    console.log(item, extraParams);
    let targetUrl = null;
    let attributes = {};
    let ignoreTabHandler = true;

    if (item.action) {
      const params = item.action.params;

      switch (item.action.type) {
        case ATypes.FILTER_LINK:
        case ATypes.JOURNAL_LINK:
          {
            let listId = params.listId || 'tasks';

            if (params.siteName) {
              listId = params.listId || 'main';
            }

            let uiType = params.uiType || '';
            let isNewUILink = uiType === 'react' || (uiType !== 'share' && isNewVersionPage());

            if (isNewUILink) {
              targetUrl = getJournalPageUrl({
                journalsListId: params.siteName ? `site-${params.siteName}-${listId}` : `global-${listId}`,
                journalId: params.journalRef,
                journalSettingId: '', // TODO?
                nodeRef: params.journalRef,
                filter: params.filterRef
              });

              ignoreTabHandler = false;
              attributes.rel = 'noopener noreferrer';
            } else {
              targetUrl = PAGE_PREFIX;
              if (params.siteName) {
                targetUrl += `/site/${params.siteName}`;
              }
              targetUrl += `/journals2/list/${listId}#`;

              if (params.journalRef) {
                targetUrl += `journal=${params.journalRef}`;
              }

              if (params.filterRef) {
                targetUrl += `&filter=${params.filterRef}`;
              } else {
                targetUrl += `&filter=`;
              }

              if (params.settings) {
                targetUrl += `&settings=${params.settings}`;
              }

              if (params.skipCount) {
                targetUrl += `&skipCount=${params.skipCount}`;
              }

              if (params.maxItems) {
                targetUrl += `&maxItems=${params.maxItems}`;
              }
            }
          }
          break;
        case ATypes.PAGE_LINK:
          let sectionPostfix = params.section ? params.section : '';
          targetUrl = `${PAGE_PREFIX}/${params.pageId}${sectionPostfix}`;
          break;
        case ATypes.SITE_LINK:
          if (isNewVersionPage()) {
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
          } else {
            targetUrl = `${PAGE_PREFIX}?site=${params.siteName}`;
          }
          break;
        default:
          break;
      }

      switch (item.action.params.pageId) {
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
        break;
      case MITypes.LINK_CREATE_CASE:
        break;
      case MITypes.ARBITRARY:
        targetUrl = get(item, 'config.url');

        if (targetUrl.includes('http')) {
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

  static getExpandableItems(items, selectedId, isSlideMenuOpen) {
    let flatList = [];

    items.forEach(item => {
      if (!!item.items) {
        const selectedChild = hasChildWithId(item.items, selectedId);
        const isNestedListExpanded = isSlideMenuOpen && (selectedChild || item.params.collapsible ? !item.params.collapsed : true);

        flatList.push(
          {
            id: item.id,
            isNestedListExpanded,
            selectedChild
          },
          ...SidebarService.getExpandableItems(item.items, selectedId, isSlideMenuOpen)
        );
      }
    });

    return flatList;
  }
}

const ATypes = SidebarService.ActionTypes;
const MITypes = MenuSettings.ItemTypes;
const PAGE_PREFIX = '/share/page';
