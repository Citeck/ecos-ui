import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { setSelectedId, toggleExpanded } from '../../actions/slideMenu';
import { t } from '../../../../helpers/util';
import ListItemIcon from '../ListItemIcon';
import lodashGet from 'lodash/get';
import { MenuApi } from '../../../../api/menu';
import { IGNORE_TABS_HANDLER_ATTR_NAME, REMOTE_TITLE_ATTR_NAME } from '../../../../constants/pageTabs';
import { getJournalPageUrl, isNewVersionPage, NEW_VERSION_PREFIX } from '../../../../helpers/urls';
import { URL } from '../../../../constants';
import SidebarService from '../../../../services/sidebar';

const PAGE_PREFIX = '/share/page';
const menuApi = new MenuApi();

const mapStateToProps = state => ({
  selectedId: state.slideMenu.selectedId,
  isSiteDashboardEnable: state.slideMenu.isSiteDashboardEnable,
  isNewJournalsPageEnable: state.slideMenu.isNewJournalsPageEnable
});

const mapDispatchToProps = (dispatch, ownProps) => ({
  onSelectItem: id => {
    SidebarService.setSelected(id);
    ownProps.toggleSlideMenu();
    dispatch(setSelectedId(id));
  },
  setExpanded: id => dispatch(toggleExpanded(id))
});

const ListItemLink = ({ item, onSelectItem, selectedId, withNestedList, isSiteDashboardEnable, isNewJournalsPageEnable }) => {
  const journalId = lodashGet(item, 'params.journalId', '');
  const [journalTotalCount, setJournalTotalCount] = useState(0);
  const attributes = {};
  let ignoreTabHandler = true;
  const getJournalCount = () => {
    if (journalId) {
      menuApi.getJournalTotalCount(journalId).then(count => {
        setJournalTotalCount(count);
      });
    }
  };

  useEffect(() => {
    SidebarService.addListener(SidebarService.UPDATE_EVENT, getJournalCount);

    return () => {
      SidebarService.removeListener(SidebarService.UPDATE_EVENT, getJournalCount);
    };
  }, []);

  useEffect(() => {
    getJournalCount();
  }, [journalId]);

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

    switch (item.action.type) {
      case 'FILTER_LINK':
      case 'JOURNAL_LINK':
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
          attributes.target = '_blank';
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

          if (isNewJournalsPageEnable) {
            targetUrl = menuApi.getNewJournalPageUrl(params);
          }
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

          if (!isSiteDashboardEnable && Array.isArray(item.items) && item.items.length > 0) {
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

          targetUrl = `${URL.DASHBOARD}?recordRef=site@${params.siteName}`;
          attributes[REMOTE_TITLE_ATTR_NAME] = true;
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
