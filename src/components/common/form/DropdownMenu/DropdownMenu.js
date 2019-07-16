import React from 'react';
import PropTypes from 'prop-types';
import DropdownMenuCascade from './DropdownMenuCascade';
import DropdownMenuGroup from './DropdownMenuGroup';
import { DropdownMenuItem } from './index';

export default class DropdownMenu extends React.Component {
  static propTypes = {
    isCascade: PropTypes.bool,
    isGroup: PropTypes.bool,
    hideLabel: PropTypes.bool,
    hideSeparator: PropTypes.bool,
    items: PropTypes.array
  };

  static defaultProps = {
    isCascade: false,
    isGroup: false,
    hideLabel: false,
    hideSeparator: false,
    items: []
  };

  render() {
    const { items, isCascade, isGroup, hideLabel, hideSeparator } = this.props;

    if (isGroup || isCascade) {
      return items.map((item, i) => {
        const key = `key-${i}-${item.id}`;

        return isCascade ? (
          <DropdownMenuCascade key={key} label={item.label} items={item.items} id={item.id} />
        ) : (
          <DropdownMenuGroup
            key={key}
            label={item.label}
            items={item.items}
            id={item.id}
            hideLabel={hideLabel}
            hideSeparator={hideSeparator}
          />
        );
      });
    }

    return items.map((item, key) => <DropdownMenuItem key={key} data={item} />);
  }
}
