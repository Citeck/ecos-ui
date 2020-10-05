import get from 'lodash/get';
import { EventEmitter2 } from 'eventemitter2';

import { getJournalPageUrl } from '../helpers/urls';
import { getSessionData, setSessionData } from '../helpers/ls';
import { hasChildWithId } from '../helpers/util';
import { isNewVersionPage, NEW_VERSION_PREFIX } from '../helpers/export/urls';
import { URL } from '../constants';
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

            // Cause: https://citeck.atlassian.net/browse/ECOSUI-499
            if (!uiType) {
              isNewUILink = extraParams.isNewUIAvailable;
            }

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
          {
            let uiType = params.uiType || '';
            let isNewUILink = uiType === 'react' || (uiType !== 'share' && isNewVersionPage());

            // Cause: https://citeck.atlassian.net/browse/ECOSUI-499
            if (!uiType) {
              isNewUILink = extraParams.isNewUIAvailable;
            }

            if (isNewUILink) {
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
const PAGE_PREFIX = '/share/page';
