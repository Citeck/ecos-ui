import React, { Component } from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';

export default class TwoIcoBtn extends Component {
  static propTypes = {
    icons: PropTypes.array,
    className: PropTypes.string
  };

  static defaultProps = {
    icons: [],
    className: ''
  };

  render() {
    const { className, icons, children, ...props } = this.props;
    const cssClasses = classNames('ecos-btn ecos-btn_mi', className);
    const [first, second] = icons;

    return (
      <button {...props} className={cssClasses}>
        <i className={classNames('ecos-btn__i', first)} />
        {children}
        <i className={classNames('ecos-btn__i', second)} />
      </button>
    );
  }
}
