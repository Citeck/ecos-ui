import React from 'react';
import PropTypes from 'prop-types';
import DropdownMenuCascade from './DropdownMenuCascade';
import DropdownMenuGroup from './DropdownMenuGroup';
import { DropdownMenuItem } from './index';

import './style.scss';
import '../form/Dropdown/Dropdown.scss';

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
    const { items, isCascade, isGroup, showLabel, showSeparator, ...someProps } = this.props;

    return (
      <div className={'ecos-dropdown-menu'}>
        {isCascade && <DropdownMenuCascade groups={items} />}
        {isGroup && <DropdownMenuGroup groups={items} showLabel={showLabel} showSeparator={showSeparator} />}
        {!(isCascade || isGroup) && items.map((item, key) => <DropdownMenuItem key={key} data={item} {...someProps} />)}
      </div>
    );
  }
}
