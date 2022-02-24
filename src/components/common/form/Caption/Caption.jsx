import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import './Caption.scss';

class Caption extends Component {
  render() {
    const { children, className, extra, large, middle, small, normal, ...props } = this.props;
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
    let TagName = '';

    switch (true) {
      case extra:
        TagName = 'h1';
        break;
      case large:
        TagName = 'h2';
        break;
      case middle:
        TagName = 'h3';
        break;
      case small:
        TagName = 'h4';
        break;
      case normal:
        TagName = 'h3';
        break;
      default:
        TagName = 'div';
        break;
    }

    return (
      <TagName className={classes} {...props}>
        {children}
      </TagName>
    );
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
