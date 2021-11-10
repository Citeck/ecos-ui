import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import isFunction from 'lodash/isFunction';

import './Checkbox.scss';

export default class ControlledCheckbox extends Component {
  static propTypes = {
    checked: PropTypes.bool,
    indeterminate: PropTypes.bool,
    disabled: PropTypes.bool,
    className: PropTypes.string,
    children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]),
    onClick: PropTypes.func
  };

  static defaultProps = {
    className: ''
  };

  handleClick = () => {
    const { onClick, checked } = this.props;

    isFunction(onClick) && onClick(!checked);
  };

  renderIcon() {
    const { disabled, checked, indeterminate } = this.props;

    return (
      <i
        className={classNames(
          'ecos-checkbox__icon',
          !checked &&
            classNames('ecos-checkbox__icon_unchecked icon-custom-checkbox-outline-unchecked', {
              'ecos-checkbox__icon_hover_blue': !disabled
            }),
          !!checked &&
            classNames('ecos-checkbox__icon_checked', {
              'ecos-checkbox__icon_blue': !disabled,
              'ecos-checkbox__icon_disabled': disabled,
              'icon-custom-checkbox-filled-indeterminate': indeterminate,
              'icon-custom-checkbox-filled-checked': !indeterminate
            })
        )}
      />
    );
  }

  render() {
    const { className, disabled, children } = this.props;

    return (
      <span className={classNames('ecos-checkbox', className, { 'ecos-checkbox_disabled': disabled })} onClick={this.handleClick}>
        {this.renderIcon()}
        {!!children && <span className="ecos-checkbox__text">{children}</span>}
      </span>
    );
  }
}
