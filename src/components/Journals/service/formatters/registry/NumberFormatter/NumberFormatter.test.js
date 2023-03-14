/* eslint-disable no-template-curly-in-string */
import BigNumber from 'bignumber.js';

import NumberFormatter from './NumberFormatter';

const numberFormatterInstance = new NumberFormatter();

const POSITIVE_DIGIT = 10;
const NEGATIVE_DIGIT = -10;
const FRACTIONAL_DIGIT = 11.15;
const BIG_DIGIT = 102392442348;
const BIG_FRACTIONAL_DIGIT = 12343243254.32432454;

const NOT_DIGIT_STRING = 'string';

const GOOD_MASK = '{value} руб. + {value} $ = ?';
const getGoodMaskTemplate = value => `${value} руб. + ${value} $ = ?`;
const BAD_MASK = '{digit} руб. + {digit} $ = ?';
const getBadMaskTemplate = () => BAD_MASK;
const STRANGE_MASK = '{value} руб. + {digit} $ = ?';
const getStrangeMaskTemplate = value => `${value} руб. + {digit} $ = ?`;

const ALL_DIGITS = [POSITIVE_DIGIT, NEGATIVE_DIGIT, FRACTIONAL_DIGIT, BIG_DIGIT, BIG_FRACTIONAL_DIGIT];

describe('NumberFormatter', () => {
  it('getType should return correct type', () => {
    expect(numberFormatterInstance.getType()).toBe(NumberFormatter.TYPE);
  });

  it('should return value if it is not number', () => {
    expect(numberFormatterInstance._formatNumber({ cell: NOT_DIGIT_STRING })).toBe(NOT_DIGIT_STRING);
  });

  describe('mask testing', () => {
    it('should work correctly with good mask', () => {
      ALL_DIGITS.forEach(digit => {
        const result = numberFormatterInstance._replaceNumberMask(digit, GOOD_MASK);
        expect(result).toBe(getGoodMaskTemplate(digit));
      });
    });

    it('should work correctly with bad mask', () => {
      ALL_DIGITS.forEach(digit => {
        const result = numberFormatterInstance._replaceNumberMask(digit, BAD_MASK);
        expect(result).toBe(getBadMaskTemplate(digit));
      });
    });

    it('should work correctly with strange mask', () => {
      ALL_DIGITS.forEach(digit => {
        const result = numberFormatterInstance._replaceNumberMask(digit, STRANGE_MASK);
        expect(result).toBe(getStrangeMaskTemplate(digit));
      });
    });
  });

  describe('mask testing', () => {
    it('should work correctly with good mask', () => {
      ALL_DIGITS.forEach(digit => {
        const result = numberFormatterInstance._replaceNumberMask(digit, GOOD_MASK);
        expect(result).toBe(getGoodMaskTemplate(digit));
      });
    });

    it('should work correctly with bad mask', () => {
      ALL_DIGITS.forEach(digit => {
        const result = numberFormatterInstance._replaceNumberMask(digit, BAD_MASK);
        expect(result).toBe(getBadMaskTemplate(digit));
      });
    });

    it('should work correctly with strange mask', () => {
      ALL_DIGITS.forEach(digit => {
        const result = numberFormatterInstance._replaceNumberMask(digit, STRANGE_MASK);
        expect(result).toBe(getStrangeMaskTemplate(digit));
      });
    });
  });

  describe('maxFractional testing', () => {
    it('should work correctly with fractional digit', () => {
      const config = {
        maximumFractionDigits: 1
      };
      const props = {
        cell: FRACTIONAL_DIGIT,
        config
      };
      const result = numberFormatterInstance._formatNumber(props);

      expect(result).toBe(FRACTIONAL_DIGIT.toFixed(1));
    });

    it('should work correctly with non fractional digit', () => {
      const config = {
        maximumFractionDigits: 1
      };
      const props = {
        cell: NEGATIVE_DIGIT,
        config
      };
      const result = numberFormatterInstance._formatNumber(props);

      expect(result).toBe(NEGATIVE_DIGIT.toString());
    });
  });

  it('should work correctly with en locale', () => {
    const config = {
      locales: 'en'
    };
    const props = {
      cell: BIG_FRACTIONAL_DIGIT,
      config
    };
    const result = numberFormatterInstance._formatNumber(props);

    expect(result).toEqual(
      new BigNumber(new BigNumber(BIG_FRACTIONAL_DIGIT).toFixed(16)).toFormat({
        decimalSeparator: '.',
        groupSeparator: ',',
        groupSize: 3
      })
    );
  });

  it('should work correctly with ru locale and custom separators', () => {
    const config = {
      locales: 'ru',
      decimalSeparator: '+',
      thousandSeparator: '_'
    };
    const props = {
      cell: BIG_FRACTIONAL_DIGIT,
      config
    };
    const result = numberFormatterInstance._formatNumber(props);

    expect(result).toEqual(
      String(
        new BigNumber(new BigNumber(BIG_FRACTIONAL_DIGIT).toFixed(16)).toFormat({
          decimalSeparator: '+',
          groupSeparator: '_',
          groupSize: 3
        })
      )
    );
  });

  it('should work correctly with ru locale and custom separators and mask', () => {
    const config = {
      mask: GOOD_MASK,
      locales: 'ru',
      decimalSeparator: '+',
      thousandSeparator: '_'
    };
    const props = {
      cell: BIG_FRACTIONAL_DIGIT,
      config
    };
    const result = numberFormatterInstance._formatNumber(props);

    expect(result).toEqual(
      getGoodMaskTemplate(
        new BigNumber(new BigNumber(BIG_FRACTIONAL_DIGIT).toFixed(16)).toFormat({
          decimalSeparator: '+',
          groupSeparator: '_',
          groupSize: 3
        })
      )
    );
  });
});
