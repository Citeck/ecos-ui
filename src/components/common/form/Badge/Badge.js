import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { isEmpty } from 'lodash';

import './style.scss';

class Badge extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    text: PropTypes.string,
    state: PropTypes.string
  };

  static defaultProps = {
    className: '',
    text: '',
    state: 'info'
  };

  render() {
    const { className, state, text } = this.props;
    const classes = classNames('ecos-badge', `ecos-badge_${state}`, className);

    return isEmpty(text) ? null : <span className={classes}>{text}</span>;
  }
}

export default Badge;
