import React, { Fragment } from 'react';
import DefaultGqlFormatter from './DefaultGqlFormatter';

export default class NumberFormatter extends DefaultGqlFormatter {
  static formatNumber(value) {
    if (!value) {
      return value;
    }

    const number = parseFloat(value);
    if (isNaN(number)) {
      return value;
    }

    return number.toLocaleString();
  }

  render() {
    const { cell } = this.props;
    return <Fragment>{NumberFormatter.formatNumber(cell)}</Fragment>;
  }
}
