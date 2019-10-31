import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { isEmpty } from 'lodash';

import './style.scss';

class Badge extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    text: PropTypes.string,
    small: PropTypes.bool,
    state: PropTypes.string
  };

  static defaultProps = {
    className: '',
    text: '',
    small: false,
    state: 'info'
  };

  render() {
    const { className, state, text, small } = this.props;
    const classes = classNames('ecos-badge', `ecos-badge_${state}`, className, {
      'ecos-badge_small': small
    });

    return isEmpty(text) ? null : <span className={classes}>{text}</span>;
  }
}

export default Badge;
