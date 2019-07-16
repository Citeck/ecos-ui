import React from 'react';
import { isEmpty } from 'lodash';
import DropdownMenuItem from '../DropdownMenuItem';
import PropTypes from 'prop-types';
import { Dropdown } from '../../index';

export default class DropdownMenuCascade extends React.Component {
  static propTypes = {
    groups: PropTypes.array
  };

  static defaultProps = {
    groups: []
  };

  renderMenuItems(items) {
    return isEmpty(items)
      ? []
      : items.map((item, key) => {
          return <DropdownMenuItem key={key} data={item} />;
        });
  }

  render() {
    const { groups } = this.props;

    return groups.map((item, i) => {
      const { id, label, items } = item;
      const key = `key-${i}-${id}`;

      return (
        <Dropdown
          className={'ecos-dropdown-menu__cascade'}
          key={key}
          source={this.renderMenuItems(items)}
          hasEmpty
          isItemComponent
          tag="div"
          direction="right"
        >
          <DropdownMenuItem data={{ id, label }} />
        </Dropdown>
      );
    });
  }
}
