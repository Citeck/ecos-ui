import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { connect } from 'react-redux';
import isEmpty from 'lodash/isEmpty';
import get from 'lodash/get';
import isEqual from 'lodash/isEqual';

import { setScrollTop, toggleExpanded, toggleIsOpen } from '../../actions/slideMenu';
import { extractLabel } from '../../helpers/util';
import { isNewVersionPage } from '../../helpers/export/urls';
import { getIconObjectWeb } from '../../helpers/icon';
import { SourcesId } from '../../constants';
import { ActionTypes } from '../../constants/sidebar';
import { MenuSettings } from '../../constants/menu';
import SidebarService from '../../services/sidebar';
import { EcosIcon, Icon } from '../common';
import RemoteBadge from './RemoteBadge';
import { ItemBtn, ItemLink } from './item-components';
import { selectIsNewUIAvailable } from '../../selectors/user';

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
    const { label: label_1, icon: icon_1 } = nextProps.data || {};
    const { label: label_2, icon: icon_2 } = this.props.data || {};

    return (
      nextProps.isExpanded !== this.props.isExpanded ||
      nextProps.isSelected !== this.props.isSelected ||
      nextProps.inDropdown !== this.props.inDropdown ||
      nextProps.isOpen !== this.props.isOpen ||
      !isEqual({ label: label_1, icon: icon_1 }, { label: label_2, icon: icon_2 })
    );
  }

  get hasSubItems() {
    return !isEmpty(get(this.props, 'data.items'));
  }

  get hasBadge() {
    const {
      styleProps: { noBadge, isSeparator }
    } = this.props;

    return !noBadge && !isSeparator;
  }

  get collapsible() {
    const collapsible = get(this.props, 'data.params.collapsible');

    return (this.props.isOpen ? collapsible : this.props.level <= SidebarService.DROPDOWN_LEVEL || collapsible) && this.hasSubItems;
  }

  get dataId() {
    return get(this.props, 'data.id');
  }

  get isHandler() {
    return (
      [ActionTypes.CREATE_SITE].includes(get(this.props, 'data.action.type', '')) ||
      [MenuSettings.ItemTypes.LINK_CREATE_CASE].includes(get(this.props, 'data.type', ''))
    );
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

  renderContent = React.memo(({ isOpen, data, styleProps: { noIcon } }) => {
    const label = extractLabel(data.label);
    let iconCode;
    let iconData;

    if (typeof data.icon === 'string' && !data.icon.includes(SourcesId.ICON) && !data.icon.includes(SourcesId.FONT_ICON)) {
      iconCode = data.icon;
    } else {
      iconData = getIconObjectWeb(data.icon);
    }

    return (
      <>
        {!noIcon && (
          <EcosIcon family="menu-items" data={iconData} className="ecos-sidebar-item__icon" code={iconCode} title={isOpen ? '' : label} />
        )}
        <div className={classNames('ecos-sidebar-item__label', { 'ecos-sidebar-item__label_with-badge': this.hasBadge })} title={label}>
          {label}
        </div>
      </>
    );
  });

  renderLabel() {
    const { isSiteDashboardEnable, data, isOpen, styleProps, isNewUIAvailable } = this.props;
    const extraParams = { isSiteDashboardEnable, isNewUIAvailable };
    const contentProps = { data, isOpen, styleProps };

    if (this.collapsible || styleProps.isSeparator) {
      return (
        <div className="ecos-sidebar-item__link">
          <this.renderContent {...contentProps} />
        </div>
      );
    }

    if (this.isHandler) {
      return (
        <ItemBtn data={data} extraParams={extraParams}>
          <this.renderContent {...contentProps} />
        </ItemBtn>
      );
    }

    return (
      <ItemLink data={data} extraParams={extraParams}>
        <this.renderContent {...contentProps} />
      </ItemLink>
    );
  }

  renderBadge() {
    const { isOpen, data } = this.props;

    return this.hasBadge ? <RemoteBadge data={data} isOpen={isOpen} /> : null;
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
      styleProps: { noIcon, isSeparator, isClosedSeparator, hiddenLabel }
    } = this.props;
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
          'ecos-sidebar-item_selected': !isSeparator && isSelected,
          'ecos-sidebar-item_title-separator': isSeparator,
          'ecos-sidebar-item_line-separator': !isOpen && isClosedSeparator,
          'ecos-sidebar-item_hidden': hiddenLabel
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
  isMobile: state.view.isMobile,
  isNewUIAvailable: selectIsNewUIAvailable(state)
});

const mapDispatchToProps = dispatch => ({
  toggleExpanded: item => dispatch(toggleExpanded(item)),
  setScrollTop: value => dispatch(setScrollTop(value)),
  toggleIsOpen: isOpen => dispatch(toggleIsOpen(isOpen))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Item);
