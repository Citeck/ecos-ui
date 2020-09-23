import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { isExistValue } from '../../../../helpers/util';

import './style.scss';

class Badge extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    text: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    short: PropTypes.bool,
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    state: PropTypes.string
  };

  static defaultProps = {
    className: '',
    text: '',
    size: 'large',
    state: 'info'
  };

  render() {
    const { className, state, text, size } = this.props;
    const classes = classNames('ecos-badge', `ecos-badge_${state}`, `ecos-badge_${size}`, className);

    return isExistValue(text) ? <span className={classes}>{text}</span> : null;
  }
}

export default Badge;
