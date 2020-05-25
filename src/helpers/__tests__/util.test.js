import { isExistValue } from '../util';

describe('Any helpers', () => {
  describe('function isExistValue', () => {
    it('check value', () => {
      expect(isExistValue(undefined)).toEqual(false);
      expect(isExistValue(null)).toEqual(false);
      expect(isExistValue(false)).toEqual(true);
      expect(isExistValue(0)).toEqual(true);
      expect(isExistValue('')).toEqual(true);
    });
  });
});
