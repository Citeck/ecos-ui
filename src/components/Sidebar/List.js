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

  onToggleSubMenu = (id, e) => {
    if (e && !this.props.isOpen) {
      this.props.toggleExpanded && this.props.toggleExpanded(id);
      e.stopPropagation();
    }
  };

  render() {
    const { data, className, level, isExpanded, expandableItems, isOpen } = this.props;
    const nextLevel = level + 1;
    const boundariesElement = this.props.boundariesElement || document.querySelector('#root') || 'viewport';

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
          const listItemDomId = `${item.id}-${level}-${i}`;
          const listItemKey = `${item.id}-${item.label}-${level}`;
          const isSubExpanded = SidebarService.isExpanded(expandableItems, item.id);
          const styleProps = SidebarService.getPropsStyleLevel({
            level,
            actionType: get(this.props, 'data.action.type', '')
          });
          const hasSubItems = !!(item.items && item.items.length);
          const SubList = expanded => (
            <ConnectList data={item.items} level={nextLevel} isExpanded={expanded} boundariesElement={boundariesElement} />
          );

          return (
            <React.Fragment key={listItemKey}>
              <Item domId={listItemDomId} data={item} level={level} isExpanded={isSubExpanded} styleProps={styleProps} />
              {hasSubItems && SubList(isOpen && isSubExpanded)}
              {level === 1 && hasSubItems && (
                <Tooltip
                  target={listItemDomId}
                  isOpen={!isOpen && isSubExpanded}
                  placement="right-start"
                  trigger="hover"
                  delay={250}
                  autohide={false}
                  toggle={this.onToggleSubMenu.bind(this, item.id)}
                  boundariesElement={boundariesElement}
                  className="ecos-sidebar-list-tooltip"
                  innerClassName="ecos-sidebar-list-tooltip-inner"
                  arrowClassName="ecos-sidebar-list-tooltip-arrow"
                  modifiers={{ flip: { behavior: ['right-start', 'right-end'] } }}
                >
                  {SubList(true)}
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
