import classNames from 'classnames';
import React, { Component } from 'react';

import './Well.scss';

export default class Well extends Component {
  rootRef = React.createRef();

  getNode() {
    return this.rootRef.current;
  }

  render() {
    const { maxHeight, ...props } = this.props;
    const cssClasses = classNames('ecos-well ecos-well_new', props.className);

    return (
      <div {...props} ref={this.rootRef} className={cssClasses} style={{ ...(maxHeight && { maxHeight }) }}>
        {props.children}
      </div>
    );
  }
}
