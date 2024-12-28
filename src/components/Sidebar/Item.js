import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { connect } from 'react-redux';
import isEmpty from 'lodash/isEmpty';
import get from 'lodash/get';
import isEqual from 'lodash/isEqual';

import Tooltip from '../common/Tooltip';
import { setScrollTop, setSelectedId, toggleExpanded, toggleIsOpen } from '../../actions/slideMenu';
import { extractLabel } from '../../helpers/util';
import { isNewVersionPage } from '../../helpers/export/urls';
import { getIconObjectWeb, getIconUpDown } from '../../helpers/icon';
import { SourcesId } from '../../constants';
import { ActionTypes } from '../../constants/sidebar';
import { MenuSettings } from '../../constants/menu';
import SidebarService from '../../services/sidebar';
import { EcosIcon, Icon } from '../common';
import RemoteBadge from './RemoteBadge';
import WorkspacePreview from '../WorkspacePreview';
import { ItemBtn, ItemLink } from './item-components';
import { selectIsNewUIAvailable } from '../../selectors/user';
import './style.scss';

class Item extends React.Component {
  static propTypes = {
    domId: PropTypes.string.isRequired,
    data: PropTypes.object,
    styleProps: PropTypes.object,
    level: PropTypes.number,
    isExpanded: PropTypes.bool,
    viewTooltip: PropTypes.bool,
    isSelected: PropTypes.bool,
    inDropdown: PropTypes.bool,
    workspace: PropTypes.object
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
      nextProps.viewTooltip !== this.props.viewTooltip ||
      nextProps.isOpen !== this.props.isOpen ||
      !isEqual({ label: label_1, icon: icon_1 }, { label: label_2, icon: icon_2 })
    );
  }

  componentDidUpdate(prevProps) {
    const { isSelected } = this.props;

    if (isSelected && prevProps.isSelected !== isSelected) {
      const activeElement = this.menuItemRef.current;
      activeElement.scrollIntoView({
        block: 'center'
      });
    }
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

  removeDollarAndHash(str) {
    return str.replace(/[$#]/g, '');
  }

  renderContent = React.memo(({ data, isOpen, styleProps: { noIcon } }) => {
    const label = extractLabel(data.label);
    const wsId = get(this.props, 'workspace.wsId');
    const dataId = this.removeDollarAndHash(get(data, 'id'));
    const targetId = dataId ? `_${dataId}` : null;

    let iconCode;
    let iconData;

    if (data.type !== 'SECTION' && wsId === 'admin$workspace' && !data.icon && get(window, 'Citeck.navigator.WORKSPACES_ENABLED', false)) {
      return (
        <Tooltip uncontrolled hideArrow showAsNeeded target={targetId} text={label} off={!isOpen || !targetId} placement="right">
          <WorkspacePreview name={label} />
          <div id={targetId} className={classNames('ecos-sidebar-item__label', { 'ecos-sidebar-item__label_with-badge': this.hasBadge })}>
            {label}
          </div>
        </Tooltip>
      );
    }

    if (typeof data.icon === 'string' && !data.icon.includes(SourcesId.ICON) && !data.icon.includes(SourcesId.FONT_ICON)) {
      iconCode = data.icon;
    } else {
      iconData = getIconObjectWeb(data.icon);
    }

    return (
      <Tooltip uncontrolled hideArrow showAsNeeded target={targetId} text={label} off={!isOpen || !targetId} placement="right">
        {!noIcon && <EcosIcon family="menu-items" data={iconData} className="ecos-sidebar-item__icon" code={iconCode} />}
        <div id={targetId} className={classNames('ecos-sidebar-item__label', { 'ecos-sidebar-item__label_with-badge': this.hasBadge })}>
          {label}
        </div>
      </Tooltip>
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

  renderLinkTooltip() {
    const { isSiteDashboardEnable, data, isNewUIAvailable, handleClick } = this.props;
    const extraParams = { isSiteDashboardEnable, isNewUIAvailable };
    const label = extractLabel(data.label);

    return (
      <ItemLink data={data} extraParams={extraParams} handleClick={handleClick}>
        <label className="ecos-sidebar-item__tooltip-link">{label}</label>
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

  renderContentItem(targetId = '') {
    const {
      level,
      isOpen,
      isExpanded,
      isSelected,
      inDropdown,
      styleProps: { isSeparator, isClosedSeparator, hiddenLabel }
    } = this.props;
    const events = {};

    if (isOpen || inDropdown) {
      events.onClick = this.onToggleList;
    }

    return (
      <div
        id={targetId}
        className={classNames('ecos-sidebar-item', `ecos-sidebar-item_lvl-${level}`, {
          'ecos-sidebar-item_collapsible': this.collapsible,
          'ecos-sidebar-item_last-lvl': !this.hasSubItems,
          'ecos-sidebar-item_nested-expanded': isExpanded && this.hasSubItems,
          'ecos-sidebar-item_selected': !isSeparator && isSelected,
          'ecos-sidebar-item_title-separator': isSeparator,
          'ecos-sidebar-item_line-separator': !isOpen && isClosedSeparator,
          'ecos-sidebar-item_hidden': hiddenLabel
        })}
        ref={this.menuItemRef}
        {...events}
      >
        {this.renderLabel()}
        {this.renderBadge()}
        {this.renderToggle()}
      </div>
    );
  }

  render() {
    const { domId, boundariesElement = 'viewport', toggleTooltip, viewTooltip } = this.props;

    const targetId = this.removeDollarAndHash(domId);

    return (
      <Tooltip
        target={targetId}
        isOpen={viewTooltip}
        placement="right-start"
        trigger="hover"
        delay={250}
        autohide={false}
        onToggle={toggleTooltip}
        hideArrow
        boundariesElement={boundariesElement}
        contentComponent={this.renderLinkTooltip()}
        innerClassName="ecos-sidebar-item__tooltip-inner"
        className="ecos-sidebar-list-dropdown-menu"
        modifiers={[
          {
            name: 'flip',
            options: {
              behavior: ['right-start', 'right-end']
            }
          }
        ]}
      >
        {this.renderContentItem(targetId)}
      </Tooltip>
    );
  }
}

const mapStateToProps = state => ({
  isOpen: get(state, 'slideMenu.isOpen'),
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

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Item);
