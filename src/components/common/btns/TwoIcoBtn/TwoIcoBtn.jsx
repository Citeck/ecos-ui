import React, { Component } from 'react';
import classNames from 'classnames';

export default class TwoIcoBtn extends Component {
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
