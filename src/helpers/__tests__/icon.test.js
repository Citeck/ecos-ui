import { getDefaultSortIconForType } from '../icon';

describe('icon helpers', () => {
  describe('getDefaultSortIconForType', () => {
    it('date → icon-small-down (descending first)', () => {
      expect(getDefaultSortIconForType('date')).toBe('icon-small-down');
    });

    it('datetime → icon-small-down (descending first)', () => {
      expect(getDefaultSortIconForType('datetime')).toBe('icon-small-down');
    });

    it('double (number) → icon-small-down (descending first)', () => {
      expect(getDefaultSortIconForType('double')).toBe('icon-small-down');
    });

    it('text → icon-small-up (ascending first)', () => {
      expect(getDefaultSortIconForType('text')).toBe('icon-small-up');
    });

    it('mltext → icon-small-up (ascending first)', () => {
      expect(getDefaultSortIconForType('mltext')).toBe('icon-small-up');
    });

    it('undefined → icon-small-up (safe fallback to ascending)', () => {
      expect(getDefaultSortIconForType(undefined)).toBe('icon-small-up');
    });
  });
});
