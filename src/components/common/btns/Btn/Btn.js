import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import './Btn.scss';

export default class Btn extends Component {
  render() {
    const { children, className, disabled, ...htmlAttr } = this.props;

    const cssClasses = classNames(
      'ecos-btn',
      {
        'ecos-btn_disabled': disabled
      },
      className
    );

    return (
      <button disabled={disabled} {...htmlAttr} className={cssClasses}>
        {children}
      </button>
    );
  }
}

Btn.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  disabled: PropTypes.bool
};
