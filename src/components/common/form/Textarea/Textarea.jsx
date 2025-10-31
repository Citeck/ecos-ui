import React, { Component } from 'react';
import classNames from 'classnames';

import './Textarea.scss';

export default class Textarea extends Component {
  render() {
    const { forwardedRef, className, ...props } = this.props;

    return <textarea type="textarea" {...props} className={classNames('textarea', className)} ref={forwardedRef} />;
  }
}
