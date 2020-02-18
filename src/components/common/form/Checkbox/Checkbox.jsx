import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { trigger } from '../../../../helpers/util';

import './Checkbox.scss';

export default class Checkbox extends Component {
  static propTypes = {
    checked: PropTypes.bool,
    indeterminate: PropTypes.bool,
    disabled: PropTypes.bool,
    title: PropTypes.string,
    className: PropTypes.string,
    children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node])
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
    const checked = !this.state.checked;

    if (this.props.disabled) {
      return false;
    }

    trigger.call(this, 'onClick', checked);

    this.change({ checked: checked });
  };

  componentDidUpdate(prevProps) {
    const props = this.props;

    if (props.checked !== prevProps.checked || props.indeterminate !== prevProps.indeterminate || props.disabled !== prevProps.disabled) {
      this.change({
        checked: props.checked,
        indeterminate: props.indeterminate
      });
    }
  }

  change(state) {
    this.setState(state);
    trigger.call(this, 'onChange', state);
  }

  renderIcons() {
    const { disabled } = this.props;
    const { checked, indeterminate } = this.state;
    const icons = [
      <i
        key="unchecked"
        className={classNames('checkbox__i icon-unchecked', {
          checkbox__i_hover_blue: !disabled
        })}
      />
    ];

    if (!disabled && !checked && !indeterminate) {
      return icons;
    }

    icons.push(
      <i
        key="dark"
        className={classNames('checkbox__i icon-checkbox-dark', {
          checkbox__i_blue: !disabled,
          checkbox__i_disabled: disabled
        })}
      />
    );
    icons.push(
      <i
        key="check-status"
        className={classNames('checkbox__i checkbox__i_white', {
          'icon-checkbox-minus-icon': indeterminate,
          'icon-checkbox-check-icon': !indeterminate && checked
        })}
      />
    );

    return icons;
  }

  render() {
    const { className, disabled, children, title } = this.props;
    const cssClasses = classNames('ecos-checkbox', className, {
      'ecos-checkbox_disabled': disabled
    });
    const text = children ? <span className={'ecos-checkbox__text'}>{children}</span> : null;

    return (
      <span className={cssClasses} onClick={this.toggle} title={title}>
        {this.renderIcons()}
        {text}
      </span>
    );
  }
}
