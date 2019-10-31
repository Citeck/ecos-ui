import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import isEmpty from 'lodash/isEmpty';
import get from 'lodash/get';
import { connect } from 'react-redux';
import { Tooltip } from 'reactstrap';

import SS from '../../services/sidebar';
import { Icon } from '../common';
import List from './List';
import RemoteBadge from './RemoteBadge';
import { ItemBtn, ItemIcon, ItemLink } from './itemComponents';

class Item extends React.Component {
  static propTypes = {
    id: PropTypes.string.isRequired,
    data: PropTypes.array,
    level: PropTypes.number,
    isDefExpanded: PropTypes.bool,
    noIcon: PropTypes.bool,
    noBadge: PropTypes.bool,
    noToggle: PropTypes.bool
  };

  static defaultProps = {
    data: [],
    level: 0,
    isDefExpanded: true,
    noIcon: true,
    noBadge: true,
    isRemoteBadge: false,
    noToggle: true
  };

  state = {
    isExpanded: false,
    styleProps: {}
  };

  constructor(props) {
    super(props);

    const { actionType } = this.parseData(props);
    const styleProps = SS.getPropsStyleLevel({ level: props.level, actionType });

    this.state.isExpanded = styleProps.isDefExpanded;
    this.state.styleProps = styleProps;
  }

  componentWillReceiveProps(nextProps, nextContext) {
    if (!nextProps.isOpen && this.props.isOpen) {
      this.setState({ isExpanded: this.state.styleProps.isDefExpanded });
    }
  }

  parseData(props = this.props) {
    const { data } = props;

    return {
      items: get(data, 'items', null),
      actionType: get(data, 'action.type', '')
    };
  }

  get hasSubItems() {
    const { items } = this.parseData();

    return !isEmpty(items);
  }

  get noMove() {
    return this.hasSubItems;
  }

  get isDropList() {
    const { isOpen, level } = this.props;

    return !isOpen && SS.DROP_MENU_BEGIN_FROM === level + 1;
  }

  getMover() {
    const { actionType } = this.parseData();

    if (this.noMove) {
      return ({ children }) => <div className="ecos-sidebar-item__link">{children}</div>;
    }

    return SS.ActionTypes.CREATE_SITE === actionType ? ItemBtn : ItemLink;
  }

  getItemContainer() {
    const { level, id } = this.props;
    const { isExpanded } = this.state;
    const { items } = this.parseData();

    return ({ children }) => (
      <div
        id={id}
        className={classNames('ecos-sidebar-item', `ecos-sidebar-item_lvl-${level}`, {
          'ecos-sidebar-item_no-action': this.noMove,
          'ecos-sidebar-item_no-items': !this.hasSubItems,
          'ecos-sidebar-item_expanded': isExpanded && this.hasSubItems
        })}
        onClick={this.toggleList}
      >
        {children}
        {this.isDropList && (
          <Tooltip
            placement="right"
            boundariesElement="window"
            target={id}
            trigger="click"
            isOpen={isExpanded}
            className="ecos-sidebar-list-tooltip"
            innerClassName="ecos-sidebar-list-tooltip-inner"
            arrowClassName="ecos-sidebar-list-tooltip-arrow"
          >
            <List isExpanded data={items} level={level + 1} />
          </Tooltip>
        )}
      </div>
    );
  }

  toggleList = e => {
    const { styleProps = {} } = this.state;
    const { noToggle } = styleProps;

    if (this.noMove && !noToggle) {
      const { isExpanded } = this.state;

      this.setState({ isExpanded: !isExpanded });
      e.stopPropagation();
    }
  };

  renderLabel() {
    const { isOpen, isSiteDashboardEnable, data } = this.props;
    const { styleProps = {} } = this.state;
    const { noIcon } = styleProps;
    const extraParams = { isSiteDashboardEnable };

    const Mover = this.getMover();

    return (
      <Mover data={data} extraParams={extraParams}>
        {!noIcon && <ItemIcon iconName={data.icon} title={isOpen ? '' : data.label} />}
        <div className="ecos-sidebar-item__label">{data.label}</div>
      </Mover>
    );
  }

  renderBadge() {
    const { isOpen, data } = this.props;
    const { styleProps = {} } = this.state;
    const { noBadge, isRemoteBadge } = styleProps;

    return !noBadge && isRemoteBadge ? <RemoteBadge data={data} isOpen={isOpen} /> : null;
  }

  renderToggle() {
    const { isOpen } = this.props;
    const { isExpanded, styleProps = {} } = this.state;
    const { noToggle } = styleProps;

    return this.hasSubItems && !noToggle ? (
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
    const { isOpen, data, level, id } = this.props;
    const { isExpanded, styleProps = {} } = this.state;
    const { collapsed } = styleProps;
    const { items } = this.parseData();

    if (isEmpty(data)) {
      return null;
    }

    const ItemContainer = this.getItemContainer();

    return (
      <>
        {(isOpen || (!isOpen && !collapsed.noName)) && (
          <ItemContainer>
            {this.renderLabel()}
            {this.renderBadge()}
            {this.renderToggle()}
          </ItemContainer>
        )}
        {!this.isDropList && <List isExpanded={isExpanded} data={items} level={level + 1} />}
      </>
    );
  }
}

const mapStateToProps = state => ({
  isOpen: state.slideMenu.isOpen,
  isSiteDashboardEnable: state.slideMenu.isSiteDashboardEnable
});

export default connect(
  mapStateToProps,
  null
)(Item);
