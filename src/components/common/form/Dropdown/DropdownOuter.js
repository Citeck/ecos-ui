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

    this.dropdownOuterRef = React.createRef();
  }

  render() {
    const { className, outClassName = '' } = this.props;
    const { dropdownOpen, targetId } = this.state;

    return (
      <div id={targetId} className={classNames('ecos-dropdown-outer', className)} ref={this.dropdownOuterRef}>
        {this.renderToggle()}
        <Tooltip
          isOpen={dropdownOpen}
          toggle={this.toggle}
          target={targetId}
          trigger="click"
          hideArrow
          className={classNames('ecos-base-tooltip ecos-base-tooltip_opaque', outClassName)}
          innerClassName="ecos-base-tooltip-inner ecos-dropdown-outer__tooltip-inner"
          placement="bottom-start"
          modifiers={{ flip: { behavior: ['bottom', 'top', 'right', 'left'] } }}
        >
          <ClickOutside
            className={this.cssDropdownMenu}
            handleClickOutside={() => dropdownOpen && this.toggle()}
            excludeElements={[this.dropdownOuterRef.current]}
          >
            {this.renderMenuItems()}
          </ClickOutside>
        </Tooltip>
      </div>
    );
  }
}
