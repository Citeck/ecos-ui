import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import './style.scss';

class Badge extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    isError: PropTypes.bool
  };

  static defaultProps = {
    className: '',
    isError: false
  };

  render() {
    const { className, children, isError } = this.props;
    const classes = classNames('ecos-badge', className, { 'ecos-badge_error': isError });

    return children ? <span className={classes}>{children}</span> : null;
  }
}

export default Badge;
