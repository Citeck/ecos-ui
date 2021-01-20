import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { Popper } from '../../index';
import { isExistValue } from '../../../../helpers/util';

import './style.scss';

class Badge extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    popupClassName: PropTypes.string,
    text: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    withPopup: PropTypes.bool,
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    state: PropTypes.string
  };

  static defaultProps = {
    className: '',
    popupClassName: '',
    text: '',
    size: 'large',
    state: 'info'
  };

  get content() {
    const { text, withPopup, popupClassName } = this.props;

    if (!withPopup) {
      return text;
    }

    return <Popper popupClassName={popupClassName} showAsNeeded text={text} />;
  }

  render() {
    const { className, state, text, size } = this.props;
    const classes = classNames('ecos-badge', `ecos-badge_${state}`, `ecos-badge_${size}`, className);

    return isExistValue(text) ? <span className={classes}>{this.content}</span> : null;
  }
}

export default Badge;
