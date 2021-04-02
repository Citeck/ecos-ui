import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import './Input.scss';

export default class Input extends Component {
  static propTypes = {
    align: PropTypes.oneOf(['left', 'center', 'right'])
  };

  static defaultProps = {
    align: 'left'
  };

  constructor(props) {
    super(props);
    this.inputRef = props.forwardedRef || React.createRef();
  }

  componentDidMount() {
    const { getInputRef, autoFocus, autoSelect, value } = this.props;

    if (autoFocus) {
      this.inputRef.current.focus();
      /**
       * Set caret to end of string (fix for IE)
       */
      this.inputRef.current.setSelectionRange(`${value}`.length, `${value}`.length);
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

  render() {
    const { getInputRef, className, autoSelect, forwardedRef, align, ...props } = this.props;
    const cssClasses = classNames('ecos-input', className, `ecos-input_${align}`);

    return <input ref={this.setRef} {...props} className={cssClasses} />;
  }
}
