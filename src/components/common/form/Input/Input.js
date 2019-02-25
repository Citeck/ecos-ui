import React, { Component } from 'react';
import classNames from 'classnames';

import './Input.scss';

export default class Input extends Component {
  render() {
    const props = this.props;
    const cssClasses = classNames('ecos-input', props.className);

    return <input {...props} className={cssClasses} />;
  }
}
