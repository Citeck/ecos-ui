import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { setSelectedId, toggleExpanded } from '../../../actions/slideMenu';
import { t } from '../../../helpers/util';
import ListItemIcon from '../ListItemIcon';
import lodashGet from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import isArray from 'lodash/isArray';
import { MenuApi } from '../../../api/menu';
import { IGNORE_TABS_HANDLER_ATTR_NAME, REMOTE_TITLE_ATTR_NAME } from '../../../constants/pageTabs';
import { getJournalPageUrl, isNewVersionPage, NEW_VERSION_PREFIX } from '../../../helpers/urls';
import { URL } from '../../../constants';

const SELECTED_MENU_ITEM_ID_KEY = 'selectedMenuItemId';
const PAGE_PREFIX = '/share/page';
const menuApi = new MenuApi();

const mapStateToProps = (state, ownProps) => ({
  selectedId: state.slideMenu.selectedId
});

const mapDispatchToProps = (dispatch, ownProps) => ({
  onSelectItem: id => {
    sessionStorage && sessionStorage.setItem && sessionStorage.setItem(SELECTED_MENU_ITEM_ID_KEY, id);
    ownProps.toggleSlideMenu();
    dispatch(setSelectedId(id));
  },
  setExpanded: id => dispatch(toggleExpanded(id))
});

const ListItemLink = ({ item, onSelectItem, selectedId, nestedList, setExpanded, isNestedListExpanded, withNestedList }) => {
  const journalId = lodashGet(item, 'params.journalId', '');
  const actionType = lodashGet(item, 'action.type', '');
  const [journalTotalCount, setJournalTotalCount] = useState(0);
  const [isSiteDashboardEnable, setSiteDashboardEnable] = useState('');
  const attributes = {};
  let ignoreTabHandler = true;

  useEffect(() => {
    if (journalId) {
      menuApi.getJournalTotalCount(journalId).then(count => {
        setJournalTotalCount(count);
      });
    }
  }, [journalId]);

  useEffect(() => {
    menuApi.checkSiteDashboardEnable().then(value => setSiteDashboardEnable(value));
  });

  let itemId = item.id;
  let label = t(item.label);

  let classes = ['slide-menu-list__link'];
  if (selectedId === itemId) {
    classes.push('slide-menu-list__link_selected');
  }
  if (withNestedList) {
    classes.push('slide-menu-list__link-with-nested-list');
  }

  let targetUrl = null;
  if (item.action) {
    const params = item.action.params;

    switch (actionType) {
      case 'FILTER_LINK':
      case 'JOURNAL_LINK':
        let listId = 'tasks';
        if (params.siteName) {
          listId = params.listId || 'main';
        }

        if (isNewVersionPage()) {
          targetUrl = getJournalPageUrl({
            journalsListId: params.siteName ? `site-${params.siteName}-${listId}` : `global-${listId}`,
            journalId: params.journalRef,
            journalSettingId: '', // TODO?
            nodeRef: params.journalRef,
            filter: params.filterRef
          });

          ignoreTabHandler = false;
          attributes.target = '_blank';
          attributes.rel = 'noopener noreferrer';
          // attributes[REMOTE_TITLE_ATTR_NAME] = true; // TODO
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

          targetUrl = menuApi.getNewJournalPageUrl(params);
        }

        break;
      case 'PAGE_LINK':
        let sectionPostfix = params.section ? params.section : '';
        targetUrl = `${PAGE_PREFIX}/${params.pageId}${sectionPostfix}`;
        break;
      case 'SITE_LINK':
        if (isNewVersionPage()) {
          ignoreTabHandler = false;
          attributes.target = '_blank';
          attributes.rel = 'noopener noreferrer';
          // attributes[REMOTE_TITLE_ATTR_NAME] = true; // TODO

          if (isSiteDashboardEnable) {
            targetUrl = `${URL.DASHBOARD}?recordRef=site@${params.siteName}`;
            attributes[REMOTE_TITLE_ATTR_NAME] = true;
            break;
          }

          if (!isEmpty(item.items) && isArray(item.items)) {
            const journalLink = item.items.find(subitem => subitem.action.type === 'JOURNAL_LINK');

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
        attributes.target = '_blank';
        attributes.rel = 'noopener noreferrer';
        break;
      default:
        break;
    }
  }

  let counter = null;
  let smallCounter = null;
  if (journalTotalCount > 0) {
    counter = <span className="slide-menu-list__link-badge">{journalTotalCount}</span>;
    smallCounter = <div className="slide-menu-list__link-badge-indicator" />;
  }

  if (ignoreTabHandler) {
    attributes[IGNORE_TABS_HANDLER_ATTR_NAME] = true;
  }

  return (
    <a
      href={targetUrl}
      onClick={() => {
        onSelectItem(itemId);
        // console.log('item', item);
      }}
      className={classes.join(' ')}
      {...attributes}
    >
      <ListItemIcon iconName={item.icon} />
      <span className={'slide-menu-list__link-label'}>
        {label}
        {counter}
      </span>
      {smallCounter}
    </a>
  );
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ListItemLink);
