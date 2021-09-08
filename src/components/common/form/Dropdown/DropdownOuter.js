import React from 'react';
import { Tooltip } from 'reactstrap';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import uniqueId from 'lodash/uniqueId';

import ZIndex from '../../../../services/ZIndex';
import ClickOutside from '../../../ClickOutside';
import Dropdown from './Dropdown';

import './Dropdown.scss';

export default class DropdownOuter extends Dropdown {
  static propTypes = {
    className: PropTypes.string,
    trigger: PropTypes.string,
    boundariesElement: PropTypes.string,
    placement: PropTypes.string,
    modifiers: PropTypes.object,
    needClose: PropTypes.bool
  };

  static defaultProps = {
    className: '',
    outClassName: 'ecos-dropdown-outer-tooltip',
    trigger: 'click',
    placement: 'bottom-start',
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

  componentDidUpdate() {
    const { outClassName } = this.props;
    const { dropdownOpen } = this.state;

    if (dropdownOpen) {
      ZIndex.calcZ();
      ZIndex.setZ(outClassName);
    }
  }

  render() {
    const { className, outClassName = '', trigger, boundariesElement, modifiers, placement } = this.props;
    const { dropdownOpen, targetId } = this.state;

    return (
      <div
        id={targetId}
        className={classNames('ecos-dropdown-outer', className, { 'ecos-dropdown-outer_open': dropdownOpen })}
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
          placement={placement}
          modifiers={modifiers}
          popperClassName="ecosZIndexAnchor"
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
