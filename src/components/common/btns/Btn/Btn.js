import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import PointsLoader from '../../PointsLoader/PointsLoader';

import './Btn.scss';

export default class Btn extends Component {
  _ref = React.createRef();

  componentDidMount() {
    const btn = this._ref.current;

    if (this.props.autoFocus && btn) {
      btn.focus();
    }
  }

  render() {
    const { children, className, disabled, loading, withoutBaseClassName, ...htmlAttr } = this.props;

    const cssClasses = classNames(
      {
        'ecos-btn': !withoutBaseClassName,
        'ecos-btn_disabled': disabled
      },
      className
    );

    return (
      <button ref={this._ref} disabled={disabled || loading} {...htmlAttr} className={cssClasses}>
        {loading && <PointsLoader className="ecos-btn__loader" />}
        <div
          className={classNames('ecos-btn__content', {
            'ecos-btn__content_hidden': loading
          })}
        >
          {children}
        </div>
      </button>
    );
  }
}

Btn.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  withoutBaseClassName: PropTypes.bool
};
