import React, { Component } from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';

import './Field.scss';

export default class Field extends Component {
  static propTypes = {
    className: PropTypes.string,
    label: PropTypes.string,
    isSmall: PropTypes.bool
  };

  static defaultProps = {
    className: ''
  };

  render() {
    const { className, isSmall, label, children } = this.props;

    return (
      <div className={classNames('ecos-field', { 'ecos-field_small': isSmall }, className)}>
        <div className={classNames('ecos-field__label', { 'ecos-field__label_small': isSmall })}>{label}</div>
        <div className={classNames('ecos-field__control', { 'ecos-field__control_small': isSmall })}>{children}</div>
      </div>
    );
  }
}
