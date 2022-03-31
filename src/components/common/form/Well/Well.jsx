import React, { Component } from 'react';
import classNames from 'classnames';

import './Well.scss';

export default class Wall extends Component {
  render() {
    const props = this.props;
    const cssClasses = classNames('ecos-well', props.className);

    return (
      <div {...props} className={cssClasses}>
        {props.children}
      </div>
    );
  }
}
