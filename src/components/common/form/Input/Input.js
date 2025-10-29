import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import Icon from '../../icons/Icon';

import './Input.scss';

export default class Input extends Component {
  static propTypes = {
    align: PropTypes.oneOf(['left', 'center', 'right']),
    forwardedRef: PropTypes.func,
    placeholder: PropTypes.string,
    type: PropTypes.string,
    autoFocus: PropTypes.bool,
    clear: PropTypes.bool,
    readonly: PropTypes.bool,
    narrow: PropTypes.bool,
    autoSelect: PropTypes.string,
    className: PropTypes.string,
    isValid: PropTypes.bool,
    needValidCheck: PropTypes.bool
  };

  static defaultProps = {
    align: 'left',
    needValidCheck: false
  };

  constructor(props) {
    super(props);
    this.inputRef = props.forwardedRef || React.createRef();
  }

  componentDidMount() {
    const { getInputRef, autoFocus, autoSelect, value, type } = this.props;

    if (autoFocus) {
      this.inputRef.current.focus();
      /**
       * Set caret to end of string (fix for IE)
       */
      if (!['number'].includes(type)) {
        this.inputRef.current.setSelectionRange(`${value}`.length, `${value}`.length);
      }
    }

    if (autoSelect) {
      this.inputRef.current.select();
    }

    if (typeof getInputRef === 'function') {
      getInputRef(this.inputRef);
    }
  }

  setRef = ref => {
    if (!ref) {
      return;
    }

    const { forwardedRef } = this.props;

    this.inputRef = { current: ref };

    if (typeof forwardedRef === 'function') {
      forwardedRef(ref);
    }
  };

  get hasClear() {
    const { clear, value } = this.props;

    return clear && value;
  }

  handleClear = () => {
    const input = this.inputRef.current;

    if (input) {
      const lastValue = input.value;

      input.value = '';

      const event = new Event('input', { bubbles: true });
      const tracker = input._valueTracker;

      if (tracker) {
        tracker.setValue(lastValue);
      }

      input.dispatchEvent(event);
    }
  };

  renderClearButton() {
    if (!this.hasClear) {
      return null;
    }

    return <Icon className="icon-small-close ecos-input__icon ecos-input__icon_clear" onClick={this.handleClear} />;
  }

  isValidClass() {
    const { isValid } = this.props;
    return isValid ? '' : 'ecos-input_not-valid-value';
  }

  render() {
    const { getInputRef, className, autoSelect, forwardedRef, align, clear, narrow, needValidCheck, isValid, children, ...props } =
      this.props;
    const isValidClass = needValidCheck ? this.isValidClass() : '';

    return (
      <div className="position-relative">
        <input
          ref={this.setRef}
          {...props}
          className={classNames('ecos-input', className, `ecos-input_${align}`, isValidClass, {
            'ecos-input_narrow': narrow
          })}
        />
        {this.renderClearButton()}
        {children}
      </div>
    );
  }
}
