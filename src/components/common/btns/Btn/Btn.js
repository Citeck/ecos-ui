import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import './Btn.scss';

export default class Btn extends Component {
  renderLoader() {
    return (
      <div className="ecos-btn__loading">
        <div className="ecos-btn__loading-child ecos-btn__loading-child-1" />
        <div className="ecos-btn__loading-child ecos-btn__loading-child-2" />
        <div className="ecos-btn__loading-child ecos-btn__loading-child-3" />
      </div>
    );
  }

  render() {
    const { children, className, disabled, loading, ...htmlAttr } = this.props;

    const cssClasses = classNames(
      'ecos-btn',
      {
        'ecos-btn_disabled': disabled
      },
      className
    );

    return (
      <button disabled={disabled} {...htmlAttr} className={cssClasses}>
        {loading ? this.renderLoader() : children}
      </button>
    );
  }
}

Btn.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  disabled: PropTypes.bool,
  loading: PropTypes.bool
};
