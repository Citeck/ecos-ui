import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import './Caption.scss';

class Caption extends Component {
  render() {
    const { children, className, extra, large, middle, small, normal } = { ...this.props };
    const classes = classNames(
      'ecos-caption',
      {
        'ecos-caption_extra': extra,
        'ecos-caption_large': large,
        'ecos-caption_middle': middle,
        'ecos-caption_small': small,
        'ecos-caption_normal': normal
      },
      className
    );

    switch (true) {
      case extra:
        return <h1 className={classes}>{children}</h1>;
      case large:
        return <h2 className={classes}>{children}</h2>;
      case middle:
        return <h3 className={classes}>{children}</h3>;
      case small:
        return <h4 className={classes}>{children}</h4>;
      case normal:
        return <h3 className={classes}>{children}</h3>;
      default:
        return <div className={classes}>{children}</div>;
    }
  }
}

Caption.propTypes = {
  className: PropTypes.string,
  extra: PropTypes.bool,
  large: PropTypes.bool,
  middle: PropTypes.bool,
  small: PropTypes.bool,
  normal: PropTypes.bool
};

Caption.defaultProps = {
  className: '',
  extra: false,
  large: false,
  middle: false,
  small: false,
  normal: false
};

export default Caption;
