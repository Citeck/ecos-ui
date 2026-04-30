import { isSavedAttValueEqual, isValidAttValueForType } from '../editorUtils';
import { getCellValue } from '../util';

const testCases1 = [undefined, 0, 1, true, false, null, 'a', ''];

const testCases2 = [
  { disp: 'Test', value: 'test' },
  { disp: 'Zero', value: 0 },
  { disp: 'One', value: 1 },
  { disp: 'True', value: true },
  { disp: 'False', value: false },
  { disp: 'Null', value: null },
  { disp: 'Undefined', value: undefined },
  { disp: 'Empty' }
];

describe('editors util', () => {
  describe('getCellValue', () => {
    it('should return same value for scalar type', () => {
      testCases1.forEach(value => {
        expect(getCellValue(value)).toBe(value);
      });
    });

    it('should return "value" property when "cell" is object', () => {
      testCases2.forEach(cell => {
        expect(getCellValue(cell)).toBe(cell.value);
      });
    });

    it('should works for multiple cell values', () => {
      expect(getCellValue(testCases1)).toEqual(testCases1);
      expect(getCellValue(testCases2)).toEqual(testCases2.map(item => item.value));
      expect(getCellValue([testCases1])).toEqual([testCases1]);
      expect(getCellValue([[testCases1]])).toEqual([[testCases1]]);
    });
  });

  describe('isSavedAttValueEqual', () => {
    it('treats null/empty/undefined as equivalent', () => {
      expect(isSavedAttValueEqual(null, undefined, 'text')).toBe(true);
      expect(isSavedAttValueEqual('', null, 'text')).toBe(true);
      expect(isSavedAttValueEqual([], null, 'text')).toBe(true);
      expect(isSavedAttValueEqual(null, 'value', 'text')).toBe(false);
    });

    it('treats numeric strings and numbers as equal for numeric columns', () => {
      expect(isSavedAttValueEqual(100, '100', 'number')).toBe(true);
      expect(isSavedAttValueEqual('100', 100, 'number')).toBe(true);
      expect(isSavedAttValueEqual(1.5, '1.50', 'double')).toBe(true);
      expect(isSavedAttValueEqual(100, 200, 'number')).toBe(false);
    });

    it('treats date display string and ISO date as equal for date columns', () => {
      expect(isSavedAttValueEqual('2024-01-15', '2024-01-15', 'date')).toBe(true);
      expect(isSavedAttValueEqual('2024-01-15T00:00:00.000+00:00', '2024-01-15', 'date')).toBe(true);
      expect(isSavedAttValueEqual('2024-01-15', '2024-01-16', 'date')).toBe(false);
    });

    it('treats datetime values equal at minute granularity', () => {
      expect(
        isSavedAttValueEqual('2024-01-15T10:30:00.000+00:00', '2024-01-15T10:30:00.000+00:00', 'datetime')
      ).toBe(true);
      expect(
        isSavedAttValueEqual('2024-01-15T10:30:45.000+00:00', '2024-01-15T10:30:00.000+00:00', 'datetime')
      ).toBe(true);
      expect(
        isSavedAttValueEqual('2024-01-15T10:31:00.000+00:00', '2024-01-15T10:30:00.000+00:00', 'datetime')
      ).toBe(false);
    });

    it('coerces values for boolean columns', () => {
      expect(isSavedAttValueEqual(true, 'true', 'boolean')).toBe(true);
      expect(isSavedAttValueEqual(true, false, 'boolean')).toBe(false);
    });

    it('falls back to deep equality for other column types', () => {
      expect(isSavedAttValueEqual('foo', 'foo', 'text')).toBe(true);
      expect(isSavedAttValueEqual('foo', 'bar', 'text')).toBe(false);
      expect(isSavedAttValueEqual({ a: 1 }, { a: 1 }, 'text')).toBe(true);
    });

    it('compares array values element-wise', () => {
      expect(isSavedAttValueEqual([1, 2], ['1', '2'], 'number')).toBe(true);
      expect(isSavedAttValueEqual([1, 2], [1, 3], 'number')).toBe(false);
      expect(isSavedAttValueEqual([1, 2], [1], 'number')).toBe(false);
    });
  });

  describe('isValidAttValueForType', () => {
    it('allows empty values (clearing)', () => {
      expect(isValidAttValueForType(null, 'date')).toBe(true);
      expect(isValidAttValueForType(undefined, 'datetime')).toBe(true);
      expect(isValidAttValueForType('', 'number')).toBe(true);
      expect(isValidAttValueForType([], 'date')).toBe(true);
    });

    it('rejects "Invalid date" string and unparseable dates', () => {
      expect(isValidAttValueForType('Invalid date', 'date')).toBe(false);
      expect(isValidAttValueForType('not-a-date', 'date')).toBe(false);
      expect(isValidAttValueForType('Invalid date', 'datetime')).toBe(false);
    });

    it('rejects dates with implausible years', () => {
      expect(isValidAttValueForType('0026-05-10', 'date')).toBe(false);
      expect(isValidAttValueForType('3500-01-01', 'date')).toBe(false);
    });

    it('accepts valid dates within plausible range', () => {
      expect(isValidAttValueForType('2024-01-15', 'date')).toBe(true);
      expect(isValidAttValueForType('2024-01-15T10:30:00.000+00:00', 'datetime')).toBe(true);
      expect(isValidAttValueForType('1900-01-01', 'date')).toBe(true);
    });

    it('rejects NaN for numeric columns', () => {
      expect(isValidAttValueForType('abc', 'number')).toBe(false);
      expect(isValidAttValueForType('1.5', 'double')).toBe(true);
      expect(isValidAttValueForType(42, 'int')).toBe(true);
    });

    it('does not validate for non-numeric, non-date types', () => {
      expect(isValidAttValueForType('anything', 'text')).toBe(true);
      expect(isValidAttValueForType('foo', 'boolean')).toBe(true);
    });

    it('validates each element of an array', () => {
      expect(isValidAttValueForType(['2024-01-15', '2024-02-15'], 'date')).toBe(true);
      expect(isValidAttValueForType(['2024-01-15', 'Invalid date'], 'date')).toBe(false);
    });
  });
});
