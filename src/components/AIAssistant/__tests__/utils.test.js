import { generateUUID, getStageStatus, formatMessageTime, truncateText } from '../utils';

describe('utils', () => {
  describe('generateUUID', () => {
    it('returns a string matching UUID v4 format', () => {
      const uuid = generateUUID();
      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    });

    it('generates unique values on each call', () => {
      const uuids = new Set(Array.from({ length: 100 }, () => generateUUID()));
      expect(uuids.size).toBe(100);
    });
  });

  describe('getStageStatus', () => {
    const range = { min: 20, max: 60 };

    it('returns "pending" when no progressRange provided', () => {
      expect(getStageStatus('stage1', 50, null)).toBe('pending');
      expect(getStageStatus('stage1', 50, undefined)).toBe('pending');
    });

    it('returns "pending" when progress is below min', () => {
      expect(getStageStatus('stage1', 10, range)).toBe('pending');
      expect(getStageStatus('stage1', 0, range)).toBe('pending');
    });

    it('returns "completed" when progress is above max', () => {
      expect(getStageStatus('stage1', 61, range)).toBe('completed');
      expect(getStageStatus('stage1', 100, range)).toBe('completed');
    });

    it('returns "active" when progress is within range', () => {
      expect(getStageStatus('stage1', 20, range)).toBe('active');
      expect(getStageStatus('stage1', 40, range)).toBe('active');
      expect(getStageStatus('stage1', 60, range)).toBe('active');
    });
  });

  describe('formatMessageTime', () => {
    it('formats time as HH:MM in 24-hour format', () => {
      const date = new Date(2024, 0, 1, 14, 30, 0);
      const result = formatMessageTime(date);
      expect(result).toMatch(/14:30/);
    });

    it('pads single-digit hours and minutes', () => {
      const date = new Date(2024, 0, 1, 9, 5, 0);
      const result = formatMessageTime(date);
      expect(result).toMatch(/09:05/);
    });
  });

  describe('truncateText', () => {
    it('returns text unchanged when shorter than maxLength', () => {
      expect(truncateText('short', 50)).toBe('short');
    });

    it('returns text unchanged when equal to maxLength', () => {
      const text = 'a'.repeat(50);
      expect(truncateText(text, 50)).toBe(text);
    });

    it('truncates and adds ellipsis when text exceeds maxLength', () => {
      const text = 'a'.repeat(60);
      const result = truncateText(text, 50);
      expect(result).toBe('a'.repeat(50) + '...');
      expect(result.length).toBe(53);
    });

    it('uses default maxLength of 50', () => {
      const text = 'a'.repeat(60);
      const result = truncateText(text);
      expect(result).toBe('a'.repeat(50) + '...');
    });

    it('returns falsy values as-is', () => {
      expect(truncateText(null)).toBe(null);
      expect(truncateText(undefined)).toBe(undefined);
      expect(truncateText('')).toBe('');
    });
  });
});
