import React, { Component } from 'react';
import classNames from 'classnames';

import './Button.scss';

export default class Button extends Component {
  render() {
    const props = this.props;
    const cssClasses = classNames(
      'button',
      {
        button_disabled: props.disabled
      },
      props.className
    );

    return (
      <button {...props} className={cssClasses}>
        {props.children}
      </button>
    );
  }
}
