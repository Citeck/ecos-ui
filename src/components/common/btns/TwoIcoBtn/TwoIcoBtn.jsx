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

  renderFirstIcon = () => {
    const {
      icons: [first]
    } = this.props;

    if (!first) {
      return null;
    }

    return <i className={classNames('ecos-btn__i', first)} />;
  };

  renderSecondIcon = () => {
    const {
      icons: [, second]
    } = this.props;

    if (!second) {
      return null;
    }

    return <i className={classNames('ecos-btn__i', second)} />;
  };

  render() {
    const { className, icons, children, ...props } = this.props;
    const cssClasses = classNames('ecos-btn ecos-btn_mi', className);

    return (
      <button {...props} className={cssClasses}>
        {this.renderFirstIcon()}
        {children}
        {this.renderSecondIcon()}
      </button>
    );
  }
}
