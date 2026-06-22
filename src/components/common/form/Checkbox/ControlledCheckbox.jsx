import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import isFunction from 'lodash/isFunction';

import CheckboxIcon from './CheckboxIcon';
import './Checkbox.scss';

export default class ControlledCheckbox extends Component {
  static propTypes = {
    checked: PropTypes.bool,
    indeterminate: PropTypes.bool,
    disabled: PropTypes.bool,
    title: PropTypes.string,
    className: PropTypes.string,
    children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]),
    onClick: PropTypes.func
  };

  static defaultProps = {
    className: '',
    title: ''
  };

  handleClick = () => {
    const { onClick, checked } = this.props;

    isFunction(onClick) && onClick(!checked);
  };

  renderIcon() {
    const { disabled, checked, indeterminate } = this.props;

    return (
      <div className={classNames('ecos-checkbox__icon', { 'ecos-checkbox__icon_disabled': disabled })}>
        <CheckboxIcon checked={checked} indeterminate={indeterminate} disabled={disabled} />
      </div>
    );
  }

  render() {
    const { className, disabled, children, title } = this.props;

    return (
      <span
        className={classNames('ecos-checkbox', className, { 'ecos-checkbox_disabled': disabled })}
        onClick={this.handleClick}
        title={title}
      >
        {this.renderIcon()}
        {!!children && <span className="ecos-checkbox__text">{children}</span>}
      </span>
    );
  }
}
