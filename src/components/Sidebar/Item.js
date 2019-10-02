import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { connect } from 'react-redux';
import isEmpty from 'lodash/isEmpty';
import get from 'lodash/get';
import SS from '../../services/sidebar';
import { Icon } from '../common';
import List from './List';
import RemoteBadge from './RemoteBadge';
import { ItemBtn, ItemIcon, ItemLink } from './itemComponents';

const mapStateToProps = state => ({
  isOpen: state.slideMenu.isOpen,
  isSiteDashboardEnable: state.slideMenu.isSiteDashboardEnable
});

class Item extends React.Component {
  static propTypes = {
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

  getMover(noMove) {
    const { actionType } = this.parseData();

    if (noMove) {
      return ({ children }) => <div className="ecos-sidebar-item__link">{children}</div>;
    }

    return SS.ActionTypes.CREATE_SITE === actionType ? ItemBtn : ItemLink;
  }

  toggleList = e => {
    const { isExpanded } = this.state;

    this.setState({ isExpanded: !isExpanded });
    e.stopPropagation();
  };

  render() {
    const { isOpen, isSiteDashboardEnable, data, level } = this.props;
    const { isExpanded, styleProps = {} } = this.state;
    const { noIcon, noBadge, noToggle, isRemoteBadge, collapsed, noMoveIfItems } = styleProps;

    if (isEmpty(data)) {
      return null;
    }
    const extraParams = { isSiteDashboardEnable };
    const { items } = this.parseData();
    const noItems = isEmpty(items);
    const noMove = !noItems && noMoveIfItems;
    const Mover = this.getMover(noMove);

    return (
      <li className="ecos-sidebar-item">
        {(isOpen || (!isOpen && !collapsed.noName)) && (
          <div className={classNames('ecos-sidebar-item__name-wrapper', { 'ecos-sidebar-item__name-wrapper_no-action': noMove })}>
            <Mover data={data} extraParams={extraParams}>
              {!noIcon && <ItemIcon iconName={data.icon} />}
              <div className="ecos-sidebar-item__label">{data.label}</div>
            </Mover>

            {!noBadge && isRemoteBadge && <RemoteBadge data={data} isOpen={isOpen} />}

            {!noItems && !noToggle && (
              <Icon
                className={classNames('ecos-sidebar-item__toggle', {
                  'ecos-sidebar-item__toggle_v': isOpen,
                  'ecos-sidebar-item__toggle_h icon-right': !isOpen && false,
                  'icon-down': !isExpanded && isOpen,
                  'icon-up': isExpanded && isOpen
                })}
                onClick={this.toggleList}
              />
            )}
          </div>
        )}
        <List isExpanded={isExpanded} data={items} level={level + 1} />
      </li>
    );
  }
}

export default connect(
  mapStateToProps,
  null
)(Item);
