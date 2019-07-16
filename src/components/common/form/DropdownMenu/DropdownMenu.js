import React from 'react';
import PropTypes from 'prop-types';
import DropdownMenuCascade from './DropdownMenuCascade';
import DropdownMenuGroup from './DropdownMenuGroup';
import { DropdownMenuItem } from './index';

export default class DropdownMenu extends React.Component {
  static propTypes = {
    isCascade: PropTypes.bool,
    isGroup: PropTypes.bool,
    showLabel: PropTypes.bool,
    showSeparator: PropTypes.bool,
    items: PropTypes.array
  };

  static defaultProps = {
    isCascade: false,
    isGroup: false,
    showLabel: false,
    showSeparator: false,
    items: []
  };

  render() {
    const { items, isCascade, isGroup, showLabel, showSeparator } = this.props;

    if (isCascade) {
      return <DropdownMenuCascade groups={items} />;
    }

    if (isGroup) {
      return <DropdownMenuGroup groups={items} showLabel={showLabel} showSeparator={showSeparator} />;
    }

    return items.map((item, key) => <DropdownMenuItem key={key} data={item} />);
  }
}
