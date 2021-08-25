import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { Icon } from '../../index';

import './Input.scss';

export default class Input extends Component {
  static propTypes = {
    align: PropTypes.oneOf(['left', 'center', 'right']),
    forwardedRef: PropTypes.func,
    placeholder: PropTypes.string,
    type: PropTypes.string,
    autoFocus: PropTypes.bool,
    clear: PropTypes.bool,
    autoSelect: PropTypes.string
  };

  static defaultProps = {
    align: 'left'
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

  render() {
    const { getInputRef, className, autoSelect, forwardedRef, align, clear, ...props } = this.props;

    return (
      <div className="position-relative">
        <input ref={this.setRef} {...props} className={classNames('ecos-input', className, `ecos-input_${align}`)} />
        {this.renderClearButton()}
      </div>
    );
  }
}
