import React, { Component } from 'react';
import classNames from 'classnames';

import './Icon.scss';

export default class Icon extends Component {
  render() {
    const props = this.props;
    const cssClasses = classNames('icon', props.className);

    return <i {...props} className={cssClasses} />;
  }
}
