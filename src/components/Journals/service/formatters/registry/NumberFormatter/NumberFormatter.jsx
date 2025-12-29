/* eslint-disable no-template-curly-in-string, no-useless-escape */
import React from 'react';
import BigNumber from 'bignumber.js';
import get from 'lodash/get';
import isNil from 'lodash/isNil';

import { getCurrentLocale, getNumberSeparators } from '../../../../../../helpers/util';
import BaseFormatter from '../../BaseFormatter';

/**
 * @typedef {NumberFormatterProps} NumberFormatterProps
 * @field {String} config.mask                      - mask for number. the main field of mask is {value}.
 * @field {Number} config.maximumFractionDigits     - accuracy.
 * @field {String} config.locales                   - locale is used for default decimal and thousand separators. default is current locale.
 * @field {String} config.decimalSeparator          - decimal separator. default is current locale decimal separator.
 * @field {String} config.thousandSeparator         - thousand separator. default is current thousand separator.
 */

export default class NumberFormatter extends BaseFormatter {
  static TYPE = 'number';

  /**
   *
   * @param {NumberFormatterProps} props
   * @returns {React.ReactNode}
   */
  format(props) {
    return <span>{this._formatNumber(props)}</span>;
  }

  _formatNumber(props) {
    const { cell, config = {} } = props;

    if (Number.isNaN(cell) || isNaN(cell)) {
      return cell;
    }

    const mask = get(config, 'mask');

    const maximumFractionDigits = Number(get(config, 'maximumFractionDigits', 16));
    const locales = get(config, 'locales', getCurrentLocale());
    const separators = getNumberSeparators(locales);
    const decimalSeparator = get(config, 'decimalSeparator', separators.decimal);
    const groupSeparator = get(config, 'thousandSeparator', separators.thousand);

    const result = new BigNumber(new BigNumber(cell).toFixed(maximumFractionDigits)).toFormat({
      decimalSeparator,
      groupSeparator,
      groupSize: 3
    });

    return this._replaceNumberMask(result, mask);
  }

  _replaceNumberMask(digit, mask) {
    if (!isNil(mask)) {
      const regex = new RegExp('{value}', 'g');
      return mask.replace(regex, digit);
    }

    return digit;
  }
}
