import React from 'react';
import { Tooltip } from 'reactstrap';
import classNames from 'classnames';
import uniqueId from 'lodash/uniqueId';

import ClickOutside from '../../../ClickOutside';
import Dropdown from './Dropdown';

import './Dropdown.scss';

export default class DropdownOuter extends Dropdown {
  constructor(props) {
    super(props);

    this.state = {
      ...this.state,
      targetId: uniqueId('EcosDropdownOuter_')
    };
  }

  render() {
    const { className } = this.props;
    const { dropdownOpen, targetId } = this.state;

    return (
      <ClickOutside
        id={targetId}
        className={classNames('ecos-dropdown-outer', className)}
        handleClickOutside={() => dropdownOpen && this.toggle()}
      >
        {this.renderToggle()}
        <Tooltip
          isOpen={dropdownOpen}
          toggle={this.toggle}
          target={targetId}
          trigger="click"
          hideArrow
          className="ecos-base-tooltip ecos-base-tooltip_opaque"
          innerClassName="ecos-base-tooltip-inner ecos-dropdown-outer__tooltip-inner"
          placement="bottom-start"
          modifiers={{ flip: { behavior: ['bottom', 'top', 'right', 'left'] } }}
        >
          <div className={this.cssDropdownMenu}>{this.renderMenuItems()}</div>
        </Tooltip>
      </ClickOutside>
    );
  }
}
