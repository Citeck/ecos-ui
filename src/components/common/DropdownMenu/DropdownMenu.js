import React from 'react';
import PropTypes from 'prop-types';
import DropdownMenuCascade from './DropdownMenuCascade';
import DropdownMenuGroup from './DropdownMenuGroup';
import { DropdownMenuItem } from './index';

import './style.scss';
import '../form/Dropdown/Dropdown.scss';

const MenuModes = {
  GROUP: 'group',
  CASCADE: 'cascade',
  LIST: 'list'
};

export default class DropdownMenu extends React.Component {
  static propTypes = {
    isCascade: PropTypes.bool,
    isGroup: PropTypes.bool,
    showLabel: PropTypes.bool,
    showSeparator: PropTypes.bool,
    items: PropTypes.array,
    mode: PropTypes.oneOf([MenuModes.CASCADE, MenuModes.GROUP, MenuModes.LIST])
  };

  static defaultProps = {
    isCascade: false,
    isGroup: false,
    showLabel: false,
    showSeparator: false,
    items: [],
    mode: MenuModes.LIST
  };

  renderMode() {
    const { mode, items, showLabel, showSeparator, ...someProps } = this.props;

    switch (mode) {
      case MenuModes.CASCADE:
        return <DropdownMenuCascade groups={items} />;
      case MenuModes.GROUP:
        return <DropdownMenuGroup groups={items} showLabel={showLabel} showSeparator={showSeparator} />;
      case MenuModes.LIST:
      default:
        return items.map((item, key) => <DropdownMenuItem key={key} data={item} {...someProps} />);
    }
  }

  render() {
    return <div className={'ecos-dropdown-menu'}>{this.renderMode()}</div>;
  }
}
