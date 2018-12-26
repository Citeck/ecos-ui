import React, { Component } from 'react';
import classNames from 'classnames';

import './Label.scss';

export default class Label extends Component {
  render() {
    const props = this.props;
    const cssClasses = classNames('label', props.className);

    return (
      <label {...props} className={cssClasses}>
        {props.children}
      </label>
    );
  }
}
