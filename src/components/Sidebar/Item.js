import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import isEmpty from 'lodash/isEmpty';
import get from 'lodash/get';
import { connect } from 'react-redux';
import { setScrollTop, setSelectedId, toggleExpanded } from '../../actions/slideMenu';
import SidebarService from '../../services/sidebar';
import { Icon } from '../common';
import RemoteBadge from './RemoteBadge';
import { ItemBtn, ItemIcon, ItemLink } from './item-components';

class Item extends React.Component {
  static propTypes = {
    domId: PropTypes.string.isRequired,
    data: PropTypes.object,
    styleProps: PropTypes.object,
    level: PropTypes.number,
    isExpanded: PropTypes.bool
  };

  static defaultProps = {
    data: {},
    styleProps: {},
    level: 0
  };

  get hasSubItems() {
    return !isEmpty(get(this.props, 'data.items'));
  }

  get collapsible() {
    return get(this.props, 'data.params.collapsible', false) && this.hasSubItems;
  }

  get dataId() {
    return get(this.props, 'data.id');
  }

  get actionType() {
    return get(this.props, 'data.action.type', '');
  }

  get isSelectedItem() {
    return this.props.selectedId === this.dataId;
  }

  get isLink() {
    return ![SidebarService.ActionTypes.CREATE_SITE].includes(this.actionType);
  }

  getMover() {
    if (this.hasSubItems) {
      return ({ children }) => <div className="ecos-sidebar-item__link">{children}</div>;
    }

    return this.isLink ? ItemLink : ItemBtn;
  }

  onToggleList = e => {
    if (this.collapsible) {
      this.props.toggleExpanded(this.dataId);
      e.stopPropagation();
    }
  };

  onClickItem = () => {
    if (this.isLink || !this.hasSubItems) {
      this.props.setSelectItem(this.dataId);
    }
  };

  renderLabel() {
    const {
      isOpen,
      isSiteDashboardEnable,
      data,
      styleProps: { noIcon }
    } = this.props;
    const extraParams = { isSiteDashboardEnable };

    const Mover = this.getMover();

    return (
      <Mover data={data} extraParams={extraParams} onClick={this.onClickItem}>
        {!noIcon && <ItemIcon iconName={data.icon} title={isOpen ? '' : get(data, 'label', '')} />}
        <div className="ecos-sidebar-item__label" title={data.label}>
          {data.label}
        </div>
      </Mover>
    );
  }

  renderBadge() {
    const {
      isOpen,
      data,
      styleProps: { noBadge }
    } = this.props;

    return !noBadge ? <RemoteBadge data={data} isOpen={isOpen} /> : null;
  }

  renderToggle() {
    const { isOpen, isExpanded } = this.props;

    return this.collapsible ? (
      <Icon
        className={classNames('ecos-sidebar-item__toggle', {
          'ecos-sidebar-item__toggle_v': isOpen,
          'ecos-sidebar-item__toggle_h icon-right': !isOpen,
          'icon-down': !isExpanded && isOpen,
          'icon-up': isExpanded && isOpen
        })}
      />
    ) : null;
  }

  render() {
    const {
      data,
      level,
      domId,
      isOpen,
      isExpanded,
      styleProps: {
        noIcon,
        collapsedMenu: { asSeparator }
      }
    } = this.props;
    const itemSeparator = !isOpen && asSeparator;
    const events = {};

    if (isOpen) {
      events.onClick = this.onToggleList;
    }

    return (
      <div
        id={domId}
        className={classNames('ecos-sidebar-item', `ecos-sidebar-item_lvl-${level}`, {
          'ecos-sidebar-item_collapsible': this.collapsible,
          'ecos-sidebar-item_last-lvl': !this.hasSubItems,
          'ecos-sidebar-item_expanded': isExpanded && this.hasSubItems,
          'ecos-sidebar-item_selected': this.isSelectedItem,
          'ecos-sidebar-item_separator': itemSeparator
        })}
        title={!isOpen && !noIcon ? get(data, 'label', '') : ''}
        {...events}
      >
        {!itemSeparator && (
          <>
            {this.renderLabel()}
            {this.renderBadge()}
            {this.renderToggle()}
          </>
        )}
      </div>
    );
  }
}

const mapStateToProps = state => ({
  isOpen: state.slideMenu.isOpen,
  isSiteDashboardEnable: state.slideMenu.isSiteDashboardEnable,
  selectedId: state.slideMenu.selectedId
});

const mapDispatchToProps = dispatch => ({
  setSelectItem: id => dispatch(setSelectedId(id)),
  toggleExpanded: id => dispatch(toggleExpanded(id)),
  setScrollTop: value => dispatch(setScrollTop(value))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Item);
