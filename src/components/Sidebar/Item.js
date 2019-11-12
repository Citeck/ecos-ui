import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import isEmpty from 'lodash/isEmpty';
import get from 'lodash/get';
import { connect } from 'react-redux';
import { setScrollTop, setSelectedId, toggleExpanded } from '../../actions/slideMenu';
import SS from '../../services/sidebar';
import { Icon } from '../common';
import RemoteBadge from './RemoteBadge';
import { ItemBtn, ItemIcon, ItemLink } from './item-components';

class Item extends React.Component {
  static propTypes = {
    id: PropTypes.string.isRequired,
    data: PropTypes.object,
    level: PropTypes.number,
    isExpanded: PropTypes.bool,
    noIcon: PropTypes.bool,
    noBadge: PropTypes.bool,
    noToggle: PropTypes.bool
  };

  static defaultProps = {
    data: [],
    level: 0,
    noIcon: true,
    noBadge: true,
    noToggle: true
  };

  state = {
    styleProps: {}
  };

  constructor(props) {
    super(props);

    this.state.styleProps = SS.getPropsStyleLevel({ level: props.level, actionType: this.actionType });
  }

  // componentWillReceiveProps(nextProps, nextContext) {
  //   const isNestedListExpandedNext = this.getIsNestedListExpanded(nextProps);
  //
  //   if (!nextProps.isOpen && this.props.isOpen) {
  //     this.setState({ isExpanded: this.state.styleProps.isDefExpanded });
  //   }
  //
  //   if (nextProps.isOpen && isNestedListExpandedNext) {
  //     this.setState({ isExpanded: isNestedListExpandedNext || this.state.styleProps.isDefExpanded });
  //   }
  // }

  get hasSubItems() {
    return !isEmpty(get(this.props, 'data.items'));
  }

  get noMove() {
    return this.hasSubItems;
  }

  get actionType() {
    return get(this.props, 'data.action.type', '');
  }

  get itemUrl() {
    const { data, isSiteDashboardEnable } = this.props;

    return SS.getPropsUrl(data, { isSiteDashboardEnable });
  }

  get isDropList() {
    const { isOpen, level } = this.props;

    return !isOpen && SS.DROP_MENU_BEGIN_FROM === level + 1;
  }

  get isSelectedItem() {
    const {
      selectedId,
      data: { id }
    } = this.props;

    return selectedId === id;
  }

  get isLink() {
    return ![SS.ActionTypes.CREATE_SITE].includes(this.actionType);
  }

  getMover() {
    if (this.noMove) {
      return ({ children }) => <div className="ecos-sidebar-item__link">{children}</div>;
    }

    return this.isLink ? ItemLink : ItemBtn;
  }

  getItemContainer() {
    const { level, id, isOpen, isExpanded } = this.props;
    const { styleProps = {} } = this.state;
    const {
      collapsed: { divInsteadName }
    } = styleProps;
    const itemSeparator = !isOpen && divInsteadName;

    return ({ children }) => (
      <>
        <div
          id={id}
          className={classNames('ecos-sidebar-item', `ecos-sidebar-item_lvl-${level}`, {
            'ecos-sidebar-item_no-action': this.noMove,
            'ecos-sidebar-item_no-items': !this.hasSubItems,
            'ecos-sidebar-item_expanded': isExpanded && this.hasSubItems,
            'ecos-sidebar-item_selected': this.isSelectedItem,
            'ecos-sidebar-item_separator': itemSeparator
          })}
          onClick={this.onToggleList}
        >
          {!itemSeparator && children}
        </div>
        {/*{this.isDropList && (*/}
        {/*  <Tooltip*/}
        {/*    target={id}*/}
        {/*    isOpen={isExpanded}*/}
        {/*    placement="right"*/}
        {/*    trigger="click"*/}
        {/*    boundariesElement="div.ecos-base-content"*/}
        {/*    className="ecos-sidebar-list-tooltip"*/}
        {/*    innerClassName="ecos-sidebar-list-tooltip-inner"*/}
        {/*    arrowClassName="ecos-sidebar-list-tooltip-arrow"*/}
        {/*  >*/}
        {/*    <ClickOutside handleClickOutside={this.onCloseTooltip} onClick={this.onCloseTooltip}>*/}
        {/*      <List isExpanded data={items} level={level + 1} />*/}
        {/*    </ClickOutside>*/}
        {/*  </Tooltip>*/}
        {/*)}*/}
      </>
    );
  }

  onToggleList = e => {
    const {
      data: { id }
    } = this.props;
    const { styleProps = {} } = this.state;
    const { noToggle } = styleProps;

    if (this.noMove && !noToggle) {
      this.props.toggleExpanded(id);
      e.stopPropagation();
    }
  };

  onCloseTooltip = () => {
    const { isOpen } = this.props;

    if (!isOpen) {
      //this.props.toggleExpanded(id);
    }
  };

  onClickItem = () => {
    if (this.isLink || !this.hasSubItems) {
      const {
        data: { id }
      } = this.props;

      this.props.setSelectItem(id);
    }
  };

  renderLabel() {
    const { isOpen, isSiteDashboardEnable, data } = this.props;
    const { styleProps = {} } = this.state;
    const { noIcon } = styleProps;
    const extraParams = { isSiteDashboardEnable };

    const Mover = this.getMover();

    return (
      <Mover data={data} extraParams={extraParams} onClick={this.onClickItem}>
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
    const { isOpen, isExpanded } = this.props;
    const { styleProps = {} } = this.state;
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
    const ItemContainer = this.getItemContainer();

    return (
      <ItemContainer>
        {this.renderLabel()}
        {/*{this.renderBadge()}*/}
        {this.renderToggle()}
      </ItemContainer>
    );
  }
}

const mapStateToProps = state => ({
  isOpen: state.slideMenu.isOpen,
  isSiteDashboardEnable: state.slideMenu.isSiteDashboardEnable,
  selectedId: state.slideMenu.selectedId
});

const mapDispatchToProps = (dispatch, ownProps) => ({
  setSelectItem: id => dispatch(setSelectedId(id)),
  toggleExpanded: id => dispatch(toggleExpanded(id)),
  setScrollTop: value => dispatch(setScrollTop(value))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Item);
