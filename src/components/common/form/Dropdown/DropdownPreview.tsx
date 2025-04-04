import classNames from 'classnames';
import React from 'react';
import { Dropdown as Drd, DropdownMenu, DropdownToggle } from 'reactstrap';

import Dropdown from './Dropdown';

export default class DropdownPreview extends Dropdown {
  render() {
    const { full, className, toggleClassName, direction, disabled, buttonIconClassName, buttonLabel, wrapperMenuClassName } = this.props;
    const { dropdownOpen } = this.state;

    const cssClasses = classNames(className, { 'ecos-dropdown_full-width': full });
    const toggleClasses = classNames('citeck-lexical-editor__dropdown-toggle', toggleClassName);
    const menuWrapperClasses = classNames('citeck-lexical-editor__dropdown', wrapperMenuClassName);

    return (
      <Drd className={cssClasses} isOpen={dropdownOpen} toggle={this.toggle} direction={direction} disabled={disabled}>
        <DropdownToggle onClick={this.toggle} data-toggle="dropdown" aria-expanded={dropdownOpen} className={toggleClasses} tag="span">
          {buttonIconClassName && <span className={buttonIconClassName} />}
          {buttonLabel && <span className="text dropdown-button-text">{buttonLabel}</span>}
          <i className="chevron-down" />
        </DropdownToggle>
        <div className={menuWrapperClasses}>
          <DropdownMenu className={this.cssDropdownMenu}>{this.renderMenuItems()}</DropdownMenu>
        </div>
      </Drd>
    );
  }
}
