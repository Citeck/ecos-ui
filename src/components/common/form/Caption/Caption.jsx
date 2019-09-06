import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import './Caption.scss';

class Caption extends Component {
  render() {
    const { children, className, extra, large, middle, small } = { ...this.props };
    const commonClassName = classNames('ecos-caption', className);

    switch (true) {
      case extra:
        return <h1 className={classNames('ecos-caption_extra', commonClassName)}>{children}</h1>;
      case large:
        return <h2 className={classNames('ecos-caption_large', commonClassName)}>{children}</h2>;
      case middle:
        return <h3 className={classNames('ecos-caption_middle', commonClassName)}>{children}</h3>;
      case small:
        return <h4 className={classNames('ecos-caption_small', commonClassName)}>{children}</h4>;
      default:
        return <div className={commonClassName}>{children}</div>;
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
