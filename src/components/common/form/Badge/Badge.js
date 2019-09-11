import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { isEmpty } from 'lodash';

import './style.scss';

class Badge extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    text: PropTypes.string,
    isError: PropTypes.bool
  };

  static defaultProps = {
    className: '',
    text: '',
    isError: false
  };

  render() {
    const { className, isError, text } = this.props;
    const classes = classNames('ecos-badge', className, { 'ecos-badge_error': isError });

    return isEmpty(text) ? null : <span className={classes}>{text}</span>;
  }
}

export default Badge;
