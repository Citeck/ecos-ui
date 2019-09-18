import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import isEmpty from 'lodash/isEmpty';
import setItemConfiguration from './ItemConfiguration';
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
    level: 0,
    isExpanded: true
  };

  render() {
    const { data, className, level, isExpanded } = this.props;

    if (isEmpty(data)) {
      return null;
    }

    const CustomItem = setItemConfiguration(Item);

    return (
      <ul
        className={classNames('ecos-sidebar-list', `ecos-sidebar-list_lvl-${level}`, className, {
          'ecos-sidebar-list_collapsed': !isExpanded,
          'ecos-sidebar-list_expanded': isExpanded
        })}
      >
        {data.map(item => (
          <CustomItem data={item} level={level} />
        ))}
      </ul>
    );
  }
}

export default List;
