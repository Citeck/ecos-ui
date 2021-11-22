import React, { Component } from 'react';
import PropTypes from 'prop-types';
import isFunction from 'lodash/isFunction';

import { ControlledCheckbox } from '../index';

import './Checkbox.scss';

export default class Checkbox extends Component {
  static propTypes = {
    checked: PropTypes.bool,
    indeterminate: PropTypes.bool,
    disabled: PropTypes.bool,
    title: PropTypes.string,
    className: PropTypes.string,
    children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]),
    onChange: PropTypes.func,
    onClick: PropTypes.func
  };

  static defaultProps = {
    checked: false,
    indeterminate: false,
    disabled: false,
    className: '',
    title: ''
  };

  constructor(props) {
    super(props);

    this.state = {
      checked: Boolean(props.checked),
      indeterminate: Boolean(props.indeterminate)
    };
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const { checked, indeterminate, disabled } = this.props;

    if (checked !== prevProps.checked || indeterminate !== prevProps.indeterminate || disabled !== prevProps.disabled) {
      this.handleChange({ checked, indeterminate });
    }
  }

  handleClick = () => {
    const { disabled, onClick } = this.props;
    const checked = !this.state.checked;

    if (disabled) {
      return false;
    }

    isFunction(onClick) && onClick(checked);

    this.handleChange({ checked });
  };

  handleChange = state => {
    const { onChange } = this.props;

    this.setState(state);

    isFunction(onChange) && onChange(state);
  };

  render() {
    const { className, disabled, children, title } = this.props;
    const { checked, indeterminate } = this.state;

    return (
      <ControlledCheckbox
        className={className}
        title={title}
        disabled={disabled}
        checked={checked}
        indeterminate={indeterminate}
        onClick={this.handleClick}
      >
        {children}
      </ControlledCheckbox>
    );
  }
}
