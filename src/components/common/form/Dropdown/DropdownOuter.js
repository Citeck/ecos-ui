import React from 'react';
import { Tooltip } from 'reactstrap';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import uniqueId from 'lodash/uniqueId';

import ClickOutside from '../../../ClickOutside';
import Dropdown from './Dropdown';

import './Dropdown.scss';

export default class DropdownOuter extends Dropdown {
  static propTypes = {
    className: PropTypes.string,
    trigger: PropTypes.string,
    boundariesElement: PropTypes.string,
    modifiers: PropTypes.object,
    needClose: PropTypes.bool,
    disabled: PropTypes.bool
  };

  static defaultProps = {
    className: '',
    trigger: 'click',
    modifiers: {
      flip: {
        behavior: ['bottom', 'top', 'right', 'left']
      }
    }
  };

  constructor(props) {
    super(props);

    this.state = {
      ...this.state,
      targetId: uniqueId('EcosDropdownOuter_')
    };

    this.dropdownOuterRef = React.createRef();
  }

  render() {
    const { className, outClassName = '', trigger, boundariesElement, modifiers, disabled } = this.props;
    const { dropdownOpen, targetId } = this.state;

    return (
      <div
        id={targetId}
        className={classNames('ecos-dropdown-outer', className, {
          'ecos-dropdown-outer_open': dropdownOpen,
          'ecos-dropdown-outer_disabled': disabled
        })}
        ref={this.dropdownOuterRef}
      >
        <div onClick={this.toggle}>{this.renderToggle()}</div>
        <Tooltip
          isOpen={dropdownOpen}
          toggle={this.toggle}
          target={targetId}
          trigger={trigger}
          hideArrow
          boundariesElement={boundariesElement}
          className={classNames('ecos-base-tooltip ecos-base-tooltip_opaque', outClassName)}
          innerClassName="ecos-base-tooltip-inner ecos-dropdown-outer__tooltip-inner"
          placement="bottom-start"
          modifiers={modifiers}
          fade={false}
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
