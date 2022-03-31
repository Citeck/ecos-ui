import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import isNil from 'lodash/isNil';

import { Popper } from '../../index';

import './style.scss';

class Badge extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    popupClassName: PropTypes.string,
    text: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    withPopup: PropTypes.bool,
    outline: PropTypes.bool,
    light: PropTypes.bool,
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    state: PropTypes.oneOf(['info', 'danger', 'primary']),
    style: PropTypes.object
  };

  static defaultProps = {
    className: '',
    popupClassName: '',
    text: '',
    size: 'large',
    state: 'info',
    style: {}
  };

  get content() {
    const { text, withPopup, popupClassName } = this.props;

    if (!withPopup) {
      return text;
    }

    return <Popper popupClassName={popupClassName} showAsNeeded text={text} />;
  }

  render() {
    const { className, state, text, size, style, outline, light } = this.props;

    if (isNil(text)) {
      return null;
    }

    const classes = classNames(
      'ecos-badge',
      `ecos-badge_${state}`,
      `ecos-badge_${size}`,
      { 'ecos-badge_outline': outline, 'ecos-badge_light': light },
      className
    );

    return (
      <span className={classes} style={style}>
        {this.content}
      </span>
    );
  }
}

export default Badge;
