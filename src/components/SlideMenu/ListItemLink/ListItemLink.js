import React from 'react';
import { connect } from 'react-redux';
import { setSelectedId, toggleExpanded } from '../../../actions/slideMenu';
import { t } from '../../../helpers/util';
import ListItemIcon from '../ListItemIcon';

const SELECTED_MENU_ITEM_ID_KEY = 'selectedMenuItemId';
const PAGE_PREFIX = '/share/page';

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
        if (params.siteName) {
          targetUrl = `${PAGE_PREFIX}/site/${params.siteName}/journals2/list/main#journal=${params.journalRef}&filter=${params.filterRef}`;
        } else {
          // params.listId
          targetUrl = `${PAGE_PREFIX}/journals2/list/tasks#journal=${params.journalRef}&filter=${params.filterRef}`;
        }
        break;
      case 'JOURNAL_LINK':
        if (params.siteName) {
          targetUrl = `${PAGE_PREFIX}/site/${params.siteName}/journals2/list/main#journal=${params.journalRef}&filter=`;
        } else {
          targetUrl = `${PAGE_PREFIX}/journals2/list/tasks#journal=${params.journalRef}&filter=`;
        }
        break;
      case 'PAGE_LINK':
        let sectionPostfix = params.section ? params.section : '';
        targetUrl = `${PAGE_PREFIX}/${params.pageId}${sectionPostfix}`;
        break;
      case 'SITE_LINK':
        targetUrl = `${PAGE_PREFIX}?site=${params.siteName}`;
        break;
      default:
        break;
    }
  }

  let counter = null;
  let smallCounter = null;
  if (item.params && item.params.count && item.params.count !== '0') {
    counter = <span className="slide-menu-list__link-badge">{item.params.count}</span>;
    smallCounter = <div className="slide-menu-list__link-badge-indicator" />;
  }

  return (
    <a
      href={targetUrl}
      onClick={() => {
        onSelectItem(itemId);
        // console.log('item', item);
      }}
      className={classes.join(' ')}
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
