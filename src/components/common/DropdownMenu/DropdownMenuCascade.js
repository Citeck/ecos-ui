import React from 'react';
import { isEmpty } from 'lodash';
import PropTypes from 'prop-types';
import { Dropdown } from '../../common/form';
import DropdownMenuItem from './DropdownMenuItem';

export default class DropdownMenuCascade extends React.Component {
  static propTypes = {
    groups: PropTypes.array
  };

  static defaultProps = {
    groups: []
  };

  className = 'ecos-dropdown-menu__cascade';

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
          className={this.className}
          toggleClassName={`${this.className}-toggle`}
          key={key}
          source={this.renderMenuItems(items)}
          hasEmpty
          isItemComponent
          tag="ul"
          direction="right"
          cascade
        >
          <DropdownMenuItem data={{ id, label }} />
        </Dropdown>
      );
    });
  }
}
