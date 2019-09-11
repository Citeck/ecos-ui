import React, { Component } from 'react';
import classNames from 'classnames';

import './Caption.scss';

export default class Caption extends Component {
  render() {
    const { children, className, extra, large, middle, normal } = { ...this.props };

    return extra ? (
      <h1 className={classNames('ecos-caption ecos-caption_extra', className)}>{children}</h1>
    ) : large ? (
      <h2 className={classNames('ecos-caption ecos-caption_large', className)}>{children}</h2>
    ) : middle ? (
      <h3 className={classNames('ecos-caption ecos-caption_middle', className)}>{children}</h3>
    ) : normal ? (
      <h3 className={classNames('ecos-caption ecos-caption_normal', className)}>{children}</h3>
    ) : null;
  }
}
