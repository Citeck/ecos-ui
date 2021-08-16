import React from 'react';
import BigNumber from 'bignumber.js';
import get from 'lodash/get';

import DefaultGqlFormatter from './DefaultGqlFormatter';
import { getNumberSeparators } from '../../../../../helpers/util';

export default class NumberFormatter extends DefaultGqlFormatter {
  static formatNumber(value, params) {
    if (value === undefined) {
      return '';
    }

    if (!value) {
      return value;
    }

    const number = parseFloat(value);

    if (isNaN(number)) {
      return value;
    }

    let maximumFractionDigits = get(params, 'maximumFractionDigits');

    if (maximumFractionDigits === undefined) {
      maximumFractionDigits = 16;
    }

    if (typeof value === 'number') {
      return number.toLocaleString(get(params, 'locales'), { maximumFractionDigits });
    }

    if (typeof value === 'string') {
      const separators = getNumberSeparators(get(params, 'locales'));

      return new BigNumber(new BigNumber(value).toFixed(maximumFractionDigits)).toFormat({
        decimalSeparator: separators.decimal,
        groupSeparator: separators.thousand,
        groupSize: 3
      });
    }

    return value;
  }

  render() {
    const { cell, params } = this.props;

    return <this.PopperWrapper text={NumberFormatter.formatNumber(cell, params)} />;
  }
}
