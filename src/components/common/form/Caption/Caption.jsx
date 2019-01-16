import React, { Component } from 'react';
import classNames from 'classnames';

import './Caption.scss';

export default class Caption extends Component {
  render() {
    const { children, className, extra, large, middle } = { ...this.props };

    return extra ? (
      <h1 className={classNames('caption caption_extra', className)}>{children}</h1>
    ) : large ? (
      <h2 className={classNames('caption caption_large', className)}>{children}</h2>
    ) : middle ? (
      <h3 className={classNames('caption caption_middle', className)}>{children}</h3>
    ) : null;
  }
}
