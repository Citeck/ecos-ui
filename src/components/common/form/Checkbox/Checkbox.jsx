import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import isFunction from 'lodash/isFunction';

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

  toggle = () => {
    const { disabled, onClick } = this.props;
    const checked = !this.state.checked;

    if (disabled) {
      return false;
    }

    if (isFunction(onClick)) {
      onClick(checked);
    }

    this.change({ checked });
  };

  componentDidUpdate(prevProps, prevState, snapshot) {
    const { checked, indeterminate, disabled } = this.props;

    if (checked !== prevProps.checked || indeterminate !== prevProps.indeterminate || disabled !== prevProps.disabled) {
      this.change({ checked, indeterminate });
    }
  }

  change(state) {
    const { onChange } = this.props;

    this.setState(state, () => isFunction(onChange) && onChange(state));
  }

  renderIcons() {
    const { disabled } = this.props;
    const { checked, indeterminate } = this.state;
    const icons = [
      <i
        key="unchecked"
        className={classNames('ecos-checkbox__icon ecos-checkbox__icon_unchecked icon-custom-checkbox-outline-unchecked', {
          'ecos-checkbox__icon_hover_blue': !disabled
        })}
      />
    ];

    if (!disabled && !checked && !indeterminate) {
      return icons;
    }

    icons.push(
      <i
        key="dark"
        className={classNames('ecos-checkbox__icon ecos-checkbox__icon_checked icon-custom-checkbox-filled-unchecked', {
          'ecos-checkbox__icon_blue': !disabled,
          'ecos-checkbox__icon_disabled': disabled
        })}
      />
    );
    icons.push(
      <i
        key="check-status"
        className={classNames('ecos-checkbox__icon ecos-checkbox__icon_checked ecos-checkbox__icon_white', {
          'icon-custom-checkbox-minus': indeterminate,
          'icon-custom-checkbox-check': !indeterminate && checked
        })}
      />
    );

    return icons;
  }

  render() {
    const { className, disabled, children, title } = this.props;

    return (
      <span className={classNames('ecos-checkbox', className, { 'ecos-checkbox_disabled': disabled })} onClick={this.toggle} title={title}>
        {this.renderIcons()}
        {children ? <span className="ecos-checkbox__text">{children}</span> : null}
      </span>
    );
  }
}
