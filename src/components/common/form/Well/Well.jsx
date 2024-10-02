import React, { Component } from 'react';
import classNames from 'classnames';

import './Well.scss';

export default class Wall extends Component {
  render() {
    const { maxHeight, isViewNewJournal, ...props } = this.props;
    const cssClasses = classNames('ecos-well', props.className, {
      'ecos-well_new': isViewNewJournal
    });

    return (
      <div {...props} className={cssClasses} style={{ ...(isViewNewJournal && maxHeight && { maxHeight }) }}>
        {props.children}
      </div>
    );
  }
}
