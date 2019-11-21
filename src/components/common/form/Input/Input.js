import React, { Component } from 'react';
import classNames from 'classnames';

import './Input.scss';

export default class Input extends Component {
  constructor(props) {
    super(props);
    this.inputRef = React.createRef();
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

  render() {
    const { getInputRef, className, autoSelect, ...props } = this.props;

    const cssClasses = classNames('ecos-input', className);

    return <input ref={this.inputRef} {...props} className={cssClasses} />;
  }
}
