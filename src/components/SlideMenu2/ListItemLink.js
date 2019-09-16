import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';
import get from 'lodash/get';
import { t } from '../../helpers/util';
import { getJournalPageUrl, isNewVersionPage, NEW_VERSION_PREFIX } from '../../helpers/urls';
import { setSelected } from '../../helpers/slideMenu';
import { URL } from '../../constants';
import { IGNORE_TABS_HANDLER_ATTR_NAME, REMOTE_TITLE_ATTR_NAME } from '../../constants/pageTabs';
import { setSelectedId, toggleExpanded } from '../../actions/slideMenu';
import { MenuApi } from '../../api/menu';
import ListItemIcon from './ListItemIcon';

const PAGE_PREFIX = '/share/page';
const menuApi = new MenuApi();

const mapStateToProps = (state, ownProps) => ({
  selectedId: state.slideMenu.selectedId
});

const mapDispatchToProps = (dispatch, ownProps) => ({
  onSelectItem: id => {
    setSelected(id);
    ownProps.toggleSlideMenu();
    dispatch(setSelectedId(id));
  },
  setExpanded: id => dispatch(toggleExpanded(id))
});

const ListItemLink = ({ item, onSelectItem, selectedId, nestedList, setExpanded, isNestedListExpanded, withNestedList }) => {
  const journalId = get(item, 'params.journalId', '');
  const [journalTotalCount, setJournalTotalCount] = useState(0);
  const attributes = {};
  let ignoreTabHandler = true;

  useEffect(() => {
    if (journalId) {
      menuApi.getJournalTotalCount(journalId).then(count => {
        setJournalTotalCount(count);
      });
    }
  }, [journalId]);

  let targetUrl = null;
  if (item.action) {
    const params = item.action.params;

    switch (item.action.type) {
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

          if (Array.isArray(item.items) && item.items.length > 0) {
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

          targetUrl = `${URL.DASHBOARD}?recordRef=site@${params.siteName}`;
          attributes[REMOTE_TITLE_ATTR_NAME] = true;
        } else {
          targetUrl = `${PAGE_PREFIX}?site=${params.siteName}`;
        }
        break;
      default:
        break;
    }

    if (item.action.params.pageId === 'bpmn-designer') {
      let sectionPostfix = params.section ? params.section : '';
      targetUrl = `${NEW_VERSION_PREFIX}/${params.pageId}${sectionPostfix}`;
      ignoreTabHandler = false;
      attributes.target = '_blank';
      attributes.rel = 'noopener noreferrer';
    }
  }

  if (ignoreTabHandler) {
    attributes[IGNORE_TABS_HANDLER_ATTR_NAME] = true;
  }

  return (
    <a
      href={targetUrl}
      onClick={() => onSelectItem(item.id)}
      className={classNames('ecos-slide-menu-item__link', { 'ecos-slide-menu-item__link_selected': selectedId === item.id })}
      {...attributes}
    >
      <ListItemIcon iconName={item.icon} />
      <span className="ecos-slide-menu-item__label"> {t(item.label)} </span>
      {journalTotalCount > 0 && <span className="ecos-slide-menu-item__badge">{journalTotalCount}</span>}
      {/*<div className="ecos-slide-menu-item__point"/>*/}
    </a>
  );
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ListItemLink);
