import classNames from 'classnames';
import React, { Component } from 'react';

import './Well.scss';

export default class Well extends Component {
  rootRef = React.createRef();

  getNode() {
    return this.rootRef.current;
  }

  render() {
    const { maxHeight, isViewNewJournal, ...props } = this.props;
    const cssClasses = classNames('ecos-well', props.className, {
      'ecos-well_new': isViewNewJournal
    });

    return (
      <div {...props} ref={this.rootRef} className={cssClasses} style={{ ...(isViewNewJournal && maxHeight && { maxHeight }) }}>
        {props.children}
      </div>
    );
  }
}
