import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { connect } from 'react-redux';
import { Tooltip } from 'reactstrap';

import SidebarService from '../../services/sidebar';
import { toggleExpanded } from '../../actions/slideMenu';
import { HiddenItemsMobile } from '../../constants/sidebar';
import Item from './Item';

class List extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    items: PropTypes.array,
    expandableItems: PropTypes.array,
    level: PropTypes.number,
    isExpanded: PropTypes.bool,
    inDropdown: PropTypes.bool
  };

  static defaultProps = {
    className: '',
    items: [],
    expandableItems: [],
    level: 0,
    inDropdown: false
  };

  get boundariesElement() {
    return this.props.boundariesElement || document.querySelector('#root') || 'viewport';
  }

  onToggleSubMenu = (item, e) => {
    const { toggleExpanded, isOpen } = this.props;

    if (e && !isOpen) {
      toggleExpanded && toggleExpanded(item);
      e.stopPropagation();
    }
  };

  renderSubList = (items, expanded, inDropdown) => (
    <ConnectList
      items={items}
      level={this.props.level + 1}
      isExpanded={expanded}
      boundariesElement={this.boundariesElement}
      inDropdown={inDropdown}
    />
  );

  renderItem = (item, i) => {
    const { level, expandableItems, isOpen, inDropdown, selectedId, isMobile } = this.props;
    const listItemDomId = `_${item.id}-${level}-${i}`;
    const listItemKey = `${item.id}-${item.label}-${level}`;
    const hasSubItems = !!(item.items && item.items.length);
    const styleProps = SidebarService.getPropsStyleLevel({ level, item });
    const isClosedSeparator = !isOpen && styleProps.isClosedSeparator;
    const isItemExpanded = SidebarService.isExpanded(expandableItems, item.id);
    const isItemSelected = selectedId === item.id;
    const isChildSelected =
      !isItemExpanded && level >= SidebarService.DROPDOWN_LEVEL && SidebarService.isSelectedChild(expandableItems, item.id);
    const isSubListExpanded = isClosedSeparator || ((isOpen || inDropdown) && isItemExpanded);

    if (isMobile && level === 0 && HiddenItemsMobile.includes(item.id)) {
      return null;
    }

    return (
      <React.Fragment key={listItemKey}>
        <Item
          domId={listItemDomId}
          data={item}
          level={level}
          isExpanded={isItemExpanded}
          isSelected={isItemSelected || isChildSelected}
          styleProps={styleProps}
          inDropdown={inDropdown}
        />
        {hasSubItems && this.renderSubList(item.items, isSubListExpanded, inDropdown)}
        {!isMobile && level === SidebarService.DROPDOWN_LEVEL && hasSubItems && (
          <Tooltip
            target={listItemDomId}
            isOpen={!isOpen && isItemExpanded}
            placement="right-start"
            trigger="hover"
            delay={250}
            autohide={false}
            toggle={this.onToggleSubMenu.bind(this, item)}
            boundariesElement={this.boundariesElement}
            className="ecos-sidebar-list-dropdown-menu"
            innerClassName="ecos-sidebar-list-dropdown-menu-inner"
            arrowClassName="ecos-sidebar-list-dropdown-menu-arrow"
            modifiers={{ flip: { behavior: ['right-start', 'right-end'] } }}
          >
            {this.renderSubList(item.items, true, true)}
          </Tooltip>
        )}
      </React.Fragment>
    );
  };

  render() {
    const { items, className, level, isExpanded } = this.props;

    if (!items || !items.length) {
      return null;
    }

    return (
      <div
        className={classNames('ecos-sidebar-list', `ecos-sidebar-list_lvl-${level}`, className, {
          'ecos-sidebar-list_collapsed': !isExpanded,
          'ecos-sidebar-list_expanded': isExpanded
        })}
      >
        {items.map(this.renderItem)}
      </div>
    );
  }
}

const mapStateToProps = state => ({
  isOpen: state.slideMenu.isOpen,
  expandableItems: state.slideMenu.expandableItems,
  selectedId: state.slideMenu.selectedId,
  isMobile: state.view.isMobile
});

const mapDispatchToProps = dispatch => ({
  toggleExpanded: item => dispatch(toggleExpanded(item))
});

const ConnectList = connect(
  mapStateToProps,
  mapDispatchToProps
)(List);

export default ConnectList;
