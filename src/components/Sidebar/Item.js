import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import isEmpty from 'lodash/isEmpty';
import get from 'lodash/get';
import { connect } from 'react-redux';
import { setScrollTop, setSelectedId, toggleExpanded, toggleIsOpen } from '../../actions/slideMenu';
import { t } from '../../helpers/util';
import SidebarService from '../../services/sidebar';
import { EcosIcon, Icon } from '../common';
import RemoteBadge from './RemoteBadge';
import { ItemBtn, ItemLink } from './item-components';
import { isNewVersionPage } from '../../helpers/export/urls';

class Item extends React.Component {
  static propTypes = {
    domId: PropTypes.string.isRequired,
    data: PropTypes.object,
    styleProps: PropTypes.object,
    level: PropTypes.number,
    isExpanded: PropTypes.bool,
    isSelected: PropTypes.bool,
    inDropdown: PropTypes.bool
  };

  static defaultProps = {
    data: {},
    styleProps: {},
    level: 0
  };

  shouldComponentUpdate(nextProps, nextState, nextContext) {
    return (
      nextProps.isExpanded !== this.props.isExpanded ||
      nextProps.isSelected !== this.props.isSelected ||
      nextProps.inDropdown !== this.props.inDropdown ||
      nextProps.isOpen !== this.props.isOpen
    );
  }

  get hasSubItems() {
    return !isEmpty(get(this.props, 'data.items'));
  }

  get collapsible() {
    const collapsible = get(this.props, 'data.params.collapsible');

    return (this.props.isOpen ? collapsible : this.props.level <= SidebarService.DROPDOWN_LEVEL || collapsible) && this.hasSubItems;
  }

  get dataId() {
    return get(this.props, 'data.id');
  }

  get actionType() {
    return get(this.props, 'data.action.type', '');
  }

  get isLink() {
    return ![SidebarService.ActionTypes.CREATE_SITE].includes(this.actionType);
  }

  onToggleList = e => {
    const { isMobile, isOpen, data, toggleExpanded, toggleIsOpen } = this.props;

    if (this.collapsible) {
      toggleExpanded(data);
      e.stopPropagation();
    } else if (isMobile) {
      toggleIsOpen(false);
    }

    // Cause: https://citeck.atlassian.net/browse/ECOSUI-354
    if (!this.collapsible && !isNewVersionPage() && isOpen) {
      toggleIsOpen(false);
    }
  };

  onClickLink = () => {
    if (!this.hasSubItems) {
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

    const label = t(data.label);
    const content = (
      <>
        {!noIcon && (
          <EcosIcon source="menu" className="ecos-sidebar-item__icon" code={data.icon} title={isOpen ? '' : get(data, 'label', '')} />
        )}
        <div className="ecos-sidebar-item__label" title={label}>
          {label}
        </div>
      </>
    );

    if (this.collapsible) {
      return <div className="ecos-sidebar-item__link">{content}</div>;
    }

    if (this.isLink) {
      return (
        <ItemLink data={data} extraParams={extraParams} onClick={this.onClickLink}>
          {content}
        </ItemLink>
      );
    }

    return (
      <ItemBtn data={data} extraParams={extraParams}>
        {content}
      </ItemBtn>
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
    const { isOpen, isExpanded, inDropdown } = this.props;

    return this.collapsible ? (
      <Icon
        className={classNames('ecos-sidebar-item__toggle', {
          'ecos-sidebar-item__toggle_v': isOpen,
          'ecos-sidebar-item__toggle_h icon-small-right': !isOpen,
          'icon-small-down': !isExpanded && (isOpen || inDropdown),
          'icon-small-up': isExpanded && (isOpen || inDropdown)
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
      isSelected,
      inDropdown,
      styleProps: {
        noIcon,
        collapsedMenu: { asSeparator }
      }
    } = this.props;
    const itemSeparator = !isOpen && asSeparator;
    const events = {};

    if (isOpen || inDropdown) {
      events.onClick = this.onToggleList;
    }

    return (
      <div
        id={domId}
        className={classNames('ecos-sidebar-item', `ecos-sidebar-item_lvl-${level}`, {
          'ecos-sidebar-item_collapsible': this.collapsible,
          'ecos-sidebar-item_last-lvl': !this.hasSubItems,
          'ecos-sidebar-item_nested-expanded': isExpanded && this.hasSubItems,
          'ecos-sidebar-item_selected': isSelected,
          'ecos-sidebar-item_separator': itemSeparator
        })}
        title={!isOpen && !noIcon ? get(data, 'label', '') : ''}
        {...events}
      >
        {this.renderLabel()}
        {this.renderBadge()}
        {this.renderToggle()}
      </div>
    );
  }
}

const mapStateToProps = state => ({
  isOpen: state.slideMenu.isOpen,
  isSiteDashboardEnable: state.slideMenu.isSiteDashboardEnable,
  isMobile: state.view.isMobile
});

const mapDispatchToProps = dispatch => ({
  setSelectItem: id => dispatch(setSelectedId(id)),
  toggleExpanded: item => dispatch(toggleExpanded(item)),
  setScrollTop: value => dispatch(setScrollTop(value)),
  toggleIsOpen: isOpen => dispatch(toggleIsOpen(isOpen))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Item);
