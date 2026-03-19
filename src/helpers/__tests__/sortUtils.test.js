import { getDefaultSortAscending, getNextSortAscending } from '../sortUtils';

describe('sortUtils helpers', () => {
  describe('getDefaultSortAscending', () => {
    it('date → false (descending first)', () => {
      expect(getDefaultSortAscending('date')).toBe(false);
    });

    it('datetime → false (descending first)', () => {
      expect(getDefaultSortAscending('datetime')).toBe(false);
    });

    it('double (number) → false (descending first)', () => {
      expect(getDefaultSortAscending('double')).toBe(false);
    });

    it('text → true (ascending first)', () => {
      expect(getDefaultSortAscending('text')).toBe(true);
    });

    it('mltext → true (ascending first)', () => {
      expect(getDefaultSortAscending('mltext')).toBe(true);
    });

    it('assoc → true (ascending first, fallback)', () => {
      expect(getDefaultSortAscending('assoc')).toBe(true);
    });

    it('undefined → true (safe fallback)', () => {
      expect(getDefaultSortAscending(undefined)).toBe(true);
    });

    it('boolean → true (ascending first, fallback)', () => {
      expect(getDefaultSortAscending('boolean')).toBe(true);
    });
  });

  describe('getNextSortAscending', () => {
    it('first click on date column → false (descending)', () => {
      expect(getNextSortAscending(undefined, 'date')).toBe(false);
    });

    it('first click on datetime column → false (descending)', () => {
      expect(getNextSortAscending(undefined, 'datetime')).toBe(false);
    });

    it('first click on number column → false (descending)', () => {
      expect(getNextSortAscending(undefined, 'double')).toBe(false);
    });

    it('first click on text column → true (ascending)', () => {
      expect(getNextSortAscending(undefined, 'text')).toBe(true);
    });

    it('first click on mltext column → true (ascending)', () => {
      expect(getNextSortAscending(undefined, 'mltext')).toBe(true);
    });

    it('null treated same as undefined (first click on date) → false', () => {
      expect(getNextSortAscending(null, 'date')).toBe(false);
    });

    it('null treated same as undefined (first click on text) → true', () => {
      expect(getNextSortAscending(null, 'text')).toBe(true);
    });

    it('toggle: was descending (false) on date → true', () => {
      expect(getNextSortAscending(false, 'date')).toBe(true);
    });

    it('toggle: was ascending (true) on date → false', () => {
      expect(getNextSortAscending(true, 'date')).toBe(false);
    });

    it('toggle: was descending (false) on text → true', () => {
      expect(getNextSortAscending(false, 'text')).toBe(true);
    });

    it('toggle: was ascending (true) on text → false', () => {
      expect(getNextSortAscending(true, 'text')).toBe(false);
    });
  });
});
