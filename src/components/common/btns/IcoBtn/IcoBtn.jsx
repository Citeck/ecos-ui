import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import Loader from '../../Loader/Loader';

export default class IcoBtn extends Component {
  static propTypes = {
    invert: PropTypes.bool,
    loading: PropTypes.bool,
    className: PropTypes.string,
    colorLoader: PropTypes.string,
    icon: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
    loaderType: PropTypes.string
  };

  static defaultProps = {
    invert: false,
    loading: false,
    colorLoader: 'currentColor',
    className: '',
    loaderType: 'points',
    icon: ''
  };

  get elIcon() {
    const { invert, children, icon } = this.props;
    const position = invert ? 'right' : 'left';

    if (!icon) {
      return null;
    }

    if (React.isValidElement(icon)) {
      return React.cloneElement(icon, {
        className: classNames(icon.props.className, 'ecos-btn__i', { [`ecos-btn__i_${position}`]: children })
      });
    }

    return <i className={classNames('ecos-btn__i', { [`ecos-btn__i_${position}`]: children }, icon)} />;
  }

  render() {
    const { className, invert, children, loading, colorLoader, loaderType, ...props } = this.props;
    const cssClasses = classNames('ecos-btn', className);

    const text = children ? <span className={'ecos-btn__text'}>{children}</span> : null;
    const first = invert ? text : this.elIcon;
    const second = invert ? this.elIcon : text;

    return (
      <button {...props} className={cssClasses}>
        {loading && <Loader color={colorLoader} type={loaderType} width="80%" height="100%" />}
        {!loading && first}
        {!loading && second}
      </button>
    );
  }
}
