import classNames from 'classnames';
import React from 'react';
import { Dropdown as Drd, DropdownMenu, DropdownToggle } from 'reactstrap';

import Dropdown from './Dropdown';

export default class DropdownPreview extends Dropdown {
  // The base class adds `ecos-dropdown__menu_new`: the typography of one-line text rows and a 200px
  // cap (`$max-width-dropdown-menu`, !important) on the menu and its list. This preview menu holds
  // custom items instead — the Lexical toolbar renders fixed-width buttons (248px `.item.wide`), which
  // the cap left hanging outside the container (COREDEV-455). Let the menu size to its items.
  get cssDropdownMenu() {
    const { right, isLinks, cascade, menuClassName } = this.props;

    return classNames(
      'ecos-dropdown__menu',
      menuClassName,
      { 'ecos-dropdown__menu_right': right },
      { 'ecos-dropdown__menu_links': isLinks },
      { 'ecos-dropdown__menu_cascade': cascade }
    );
  }

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
          <DropdownMenu className={this.cssDropdownMenu}>
            <this.renderMenuItems />
          </DropdownMenu>
        </div>
      </Drd>
    );
  }
}
