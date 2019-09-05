import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import './Caption.scss';

class Caption extends Component {
  render() {
    const { children, className, extra, large, middle, small } = { ...this.props };

    switch (true) {
      case extra:
        return <h1 className={classNames('ecos-caption ecos-caption_extra', className)}>{children}</h1>;
      case large:
        return <h2 className={classNames('ecos-caption ecos-caption_large', className)}>{children}</h2>;
      case middle:
        return <h3 className={classNames('ecos-caption ecos-caption_middle', className)}>{children}</h3>;
      case small:
        return <h4 className={classNames('ecos-caption ecos-caption_small', className)}>{children}</h4>;
      default:
        return <div className={classNames(className)}>{children}</div>;
    }
  }
}

Caption.propTypes = {
  className: PropTypes.string,
  extra: PropTypes.bool,
  large: PropTypes.bool,
  middle: PropTypes.bool,
  small: PropTypes.bool
};

Caption.defaultProps = {
  className: '',
  extra: false,
  large: false,
  middle: false,
  small: false
};

export default Caption;
