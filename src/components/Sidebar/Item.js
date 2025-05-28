import classNames from 'classnames';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';
import isString from 'lodash/isString';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import WorkspacePreview from '../WorkspacePreview';
import { EcosIcon, Icon } from '../common';

import RemoteBadge from './RemoteBadge';
import { ItemBtn, ItemLink } from './item-components';

import { setScrollTop, setSelectedId, toggleExpanded, toggleIsOpen } from '@/actions/slideMenu';
import { ADMIN_WORKSPACE_ID, SourcesId, TMP_ICON_EMPTY } from '@/constants';
import { MenuSettings } from '@/constants/menu';
import { ActionTypes } from '@/constants/sidebar';
import { isNewVersionPage } from '@/helpers/export/urls';
import { getIconObjectWeb, getIconUpDown } from '@/helpers/icon';
import { getWorkspaceId } from '@/helpers/urls.js';
import { extractLabel, getEnabledWorkspaces } from '@/helpers/util';
import { selectIsNewUIAvailable } from '@/selectors/user';
import SidebarService from '@/services/sidebar';

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

  menuItemRef = React.createRef();

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
    const Types = MenuSettings.ItemTypes;
    const type = get(this.props, 'data.action.type', '') || get(this.props, 'data.type', '');

    return [ActionTypes.CREATE_SITE, Types.LINK_CREATE_CASE, Types.START_WORKFLOW].includes(type);
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
    const workspaceId = getWorkspaceId();
    const enabledWorkspaces = getEnabledWorkspaces();

    let iconCode;
    let iconData;

    const isDefaultIcon = !data?.icon || (isString(get(data, 'icon')) && data.icon.includes(TMP_ICON_EMPTY));
    if (data.type !== MenuSettings.ItemTypes.SECTION && workspaceId === ADMIN_WORKSPACE_ID && isDefaultIcon && enabledWorkspaces) {
      return (
        <>
          <WorkspacePreview name={label} />
          <div className={classNames('ecos-sidebar-item__label', { 'ecos-sidebar-item__label_with-badge': this.hasBadge })} title={label}>
            {label}
          </div>
        </>
      );
    }

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
    const { isSiteDashboardEnable, data, isOpen, styleProps, isNewUIAvailable, handleClick } = this.props;
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
      <ItemLink data={data} extraParams={extraParams} handleClick={handleClick}>
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
        className={classNames('ecos-sidebar-item__toggle', getIconUpDown(isExpanded && (isOpen || inDropdown)), {
          'ecos-sidebar-item__toggle_v': isOpen,
          'ecos-sidebar-item__toggle_h icon-small-right': !isOpen
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
        title={!isOpen && !noIcon ? extractLabel(get(data, 'label', '')) : ''}
        ref={this.menuItemRef}
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
  toggleIsOpen: isOpen => dispatch(toggleIsOpen(isOpen)),
  handleClick: id => dispatch(setSelectedId(id))
});

export default connect(mapStateToProps, mapDispatchToProps)(Item);
