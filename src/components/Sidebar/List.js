import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { connect } from 'react-redux';
import SidebarService from '../../services/sidebar';
import Item from './Item';

class List extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    data: PropTypes.array,
    level: PropTypes.number,
    isExpanded: PropTypes.bool
  };

  static defaultProps = {
    className: '',
    data: [],
    expandableItems: [],
    level: 0
  };

  render() {
    const { data, className, level, isExpanded, expandableItems } = this.props;
    const nextLevel = level + 1;
    console.log(expandableItems);
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
          console.log(item.id, expandableItems.find(fi => fi.id === item.id));

          return (
            <React.Fragment key={id}>
              <Item data={item} level={level} id={id} isExpanded={isSubExpanded} />
              <List data={item.items} level={nextLevel} isExpanded={isSubExpanded} />
            </React.Fragment>
          );
        })}
      </div>
    );
  }
}

const mapStateToProps = state => ({
  expandableItems: state.slideMenu.expandableItems
});

export default connect(
  mapStateToProps,
  null
)(List);
