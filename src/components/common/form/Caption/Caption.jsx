import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import './Caption.scss';

class Caption extends Component {
  render() {
    const { children, className, extra, large, middle } = { ...this.props };

    return extra ? (
      <h1 className={classNames('ecos-caption ecos-caption_extra', className)}>{children}</h1>
    ) : large ? (
      <h2 className={classNames('ecos-caption ecos-caption_large', className)}>{children}</h2>
    ) : middle ? (
      <h3 className={classNames('ecos-caption ecos-caption_middle', className)}>{children}</h3>
    ) : null;
  }
}

Caption.propTypes = {
  className: PropTypes.string,
  extra: PropTypes.bool,
  large: PropTypes.bool,
  middle: PropTypes.bool
};

Caption.defaultProps = {
  className: '',
  extra: false,
  large: false,
  middle: false
};

export default Caption;
