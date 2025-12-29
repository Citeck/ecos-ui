import React, { Component } from 'react';
import PropTypes from 'prop-types';

import './style.scss';

class Radio extends Component {
  static propTypes = {
    name: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    className: PropTypes.string,
    checked: PropTypes.bool,
    disabled: PropTypes.bool,
    error: PropTypes.bool,
    onChange: PropTypes.func
  };

  static defaultProps = {
    className: '',
    checked: false,
    disabled: false,
    error: false,
    onChange: () => {}
  };

  get className() {
    const { className, disabled, checked, error } = this.props;
    const classes = ['ecos-radio', className];

    if (disabled) {
      classes.push('ecos-radio_disabled');
    }

    if (checked) {
      classes.push('ecos-radio_checked');
    }

    if (error) {
      classes.push('ecos-radio_error');
    }

    return classes.join(' ');
  }

  handleChange = event => {
    const { onChange, disabled } = this.props;

    if (disabled) {
      return;
    }

    onChange(event.currentTarget.value === 'on');
  };

  render() {
    const { name, label, checked } = this.props;

    return (
      <label className={this.className}>
        <span className="ecos-radio__label">{label}</span>
        <input className="ecos-radio__input" type="radio" name={name} checked={checked} onChange={this.handleChange} />
        <span className="ecos-radio__checkmark" />
      </label>
    );
  }
}

export default Radio;
