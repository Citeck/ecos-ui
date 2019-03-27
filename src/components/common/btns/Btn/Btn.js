import React, { Component } from 'react';
import classNames from 'classnames';

import './Btn.scss';

export default class Btn extends Component {
  render() {
    const props = this.props;
    const cssClasses = classNames('ecos-btn', props.className);

    return (
      <button {...props} className={cssClasses}>
        {props.children}
      </button>
    );
  }
}
