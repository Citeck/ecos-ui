import React, { Component } from 'react';
import classNames from 'classnames';

import './Btn.scss';

export default class Btn extends Component {
  render() {
    const props = this.props;
    const cssClasses = classNames('btn', props.className);

    return (
      <a {...props} className={cssClasses}>
        {props.children}
      </a>
    );
  }
}
