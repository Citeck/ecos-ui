import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import PointsLoader from '../../PointsLoader/PointsLoader';

import './Btn.scss';

export default class Btn extends Component {
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
        {loading ? <PointsLoader /> : children}
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
