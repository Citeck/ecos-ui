import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { connect } from 'react-redux';
import get from 'lodash/get';
import { Tooltip } from 'reactstrap';

import SidebarService from '../../services/sidebar';
import { toggleExpanded } from '../../actions/slideMenu';
import Item from './Item';

class List extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    data: PropTypes.array,
    expandableItems: PropTypes.array,
    level: PropTypes.number,
    isExpanded: PropTypes.bool
  };

  static defaultProps = {
    className: '',
    data: [],
    expandableItems: [],
    level: 0
  };

  onCloseTooltip = (id, expanded) => {
    const { isOpen, level } = this.props;

    if (!isOpen && expanded && level === 1) {
      this.props.toggleExpanded && this.props.toggleExpanded(id);
    }
  };

  render() {
    const { data, className, level, isExpanded, expandableItems, isOpen } = this.props;
    const nextLevel = level + 1;

    if (!data || !data.length) {
      return null;
    }

    return (
      <div
        className={classNames('ecos-sidebar-list', `ecos-sidebar-list_lvl-${level}`, className, {
          'ecos-sidebar-list_collapsed': !isExpanded,
          'ecos-sidebar-list_expanded': isExpanded
        })}
      >
        {data.map((item, i) => {
          const domId = `lvl-${level}-${i}-${item.id}`;
          const isSubExpanded = SidebarService.isExpanded(expandableItems, item.id);
          const styleProps = SidebarService.getPropsStyleLevel({
            level,
            actionType: get(this.props, 'data.action.type', '')
          });
          const SubList = expanded => <ConnectList data={item.items} level={nextLevel} isExpanded={expanded} />;

          return (
            <React.Fragment key={`key-${domId}`}>
              <Item domId={domId} data={item} level={level} isExpanded={isSubExpanded} styleProps={styleProps} />
              {SubList(isOpen && isSubExpanded)}
              {level === 1 && (
                <Tooltip
                  target={domId}
                  isOpen={!isOpen && isSubExpanded}
                  placement="right"
                  trigger="hover"
                  boundariesElement="div.ecos-base-content"
                  className="ecos-sidebar-list-tooltip"
                  innerClassName="ecos-sidebar-list-tooltip-inner"
                  arrowClassName="ecos-sidebar-list-tooltip-arrow"
                >
                  <div onMouseLeave={this.onCloseTooltip.bind(this, item.id, isSubExpanded)}>{SubList(true)}</div>
                </Tooltip>
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  }
}

const mapStateToProps = state => ({
  isOpen: state.slideMenu.isOpen,
  expandableItems: state.slideMenu.expandableItems
});

const mapDispatchToProps = dispatch => ({
  toggleExpanded: id => dispatch(toggleExpanded(id))
});

const ConnectList = connect(
  mapStateToProps,
  mapDispatchToProps
)(List);

export default ConnectList;
