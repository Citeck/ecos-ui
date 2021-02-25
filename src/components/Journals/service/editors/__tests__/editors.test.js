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
});
