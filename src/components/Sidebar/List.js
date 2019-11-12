import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import get from 'lodash/get';
import SidebarService from '../../services/sidebar';
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

  get isTooltipList() {
    const { isOpen, level } = this.props;

    return !isOpen && SidebarService.DROP_MENU_BEGIN_FROM === level;
  }

  render() {
    const { data, className, level, isExpanded, expandableItems } = this.props;
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
          const id = `lvl-${level}-${i}-${item.id}`;
          const isSubExpanded = SidebarService.isExpanded(expandableItems, item.id);
          const styleProps = SidebarService.getPropsStyleLevel({ level, actionType: get(this.props, 'data.action.type', '') });

          return (
            <React.Fragment key={id}>
              <Item data={item} level={level} id={id} isExpanded={isSubExpanded} styleProps={styleProps} />
              <List data={item.items} level={nextLevel} isExpanded={isSubExpanded} expandableItems={expandableItems} />
            </React.Fragment>
          );
        })}
      </div>
    );
  }
}

export default List;
