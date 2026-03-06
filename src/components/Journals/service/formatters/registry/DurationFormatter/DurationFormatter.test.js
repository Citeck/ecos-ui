import DurationFormatter from './DurationFormatter';

const durationFormatterInstance = new DurationFormatter();

describe('DurationFormatter', () => {
  it('getType should return correct type', () => {
    expect(durationFormatterInstance.getType()).toBe(DurationFormatter.TYPE);
  });

  it('should format duration correctly without seconds', () => {
    const props = {
      cell: 94545000, // 1d 2h 15m 45s
      config: { showSeconds: false }
    };
    const result = durationFormatterInstance.format(props);
    expect(result).toBe('1d 2h 15m');
  });

  it('should format duration correctly without seconds as string', () => {
    const props = {
      cell: 94545000, // 1d 2h 15m 45s
      config: { showSeconds: 'false' }
    };
    const result = durationFormatterInstance.format(props);
    expect(result).toBe('1d 2h 15m');
  });

  it('should format duration correctly with seconds', () => {
    const props = {
      cell: 94545000, // 1d 2h 15m 45s,
      config: { showSeconds: true }
    };
    const result = durationFormatterInstance.format(props);
    expect(result).toBe('1d 2h 15m 45s');
  });

  it('should format duration correctly without config with default show seconds', () => {
    const props = {
      cell: 94545000 // 1d 2h 15m 45s
    };
    const result = durationFormatterInstance.format(props);
    expect(result).toBe('1d 2h 15m 45s');
  });

  it('should format duration correctly with zero hours and minutes and seconds', () => {
    const props = {
      cell: 86400000, // 1d
      config: { showSeconds: true }
    };
    const result = durationFormatterInstance.format(props);
    expect(result).toBe('1d');
  });

  it('should format duration correctly with zero hours and minutes', () => {
    const props = {
      cell: 86430000, // 1d 30s
      config: { showSeconds: true }
    };
    const result = durationFormatterInstance.format(props);
    expect(result).toBe('1d 30s');
  });

  it('should format duration correctly with zero days and hours', () => {
    const props = {
      cell: 945000, // 15m 45s
      config: { showSeconds: true }
    };
    const result = durationFormatterInstance.format(props);
    expect(result).toBe('15m 45s');
  });

  it('should format duration correctly with zero days and hours and seconds', () => {
    const props = {
      cell: 30 * 60 * 1000, // 30 minutes
      config: { showSeconds: true }
    };
    const result = durationFormatterInstance.format(props);
    expect(result).toBe('30m');
  });

  it('should format duration correctly with zero days, hours, and minutes', () => {
    const props = {
      cell: 45 * 1000, // 45 seconds
      config: { showSeconds: true }
    };
    const result = durationFormatterInstance.format(props);
    expect(result).toBe('45s');
  });

  it('should format duration correctly with zero milliseconds with show seconds', () => {
    const props = {
      cell: 0,
      config: { showSeconds: true }
    };
    const result = durationFormatterInstance.format(props);
    expect(result).toBe('0s');
  });

  it('should format duration correctly with zero milliseconds with not show seconds', () => {
    const props = {
      cell: 0,
      config: { showSeconds: false }
    };
    const result = durationFormatterInstance.format(props);
    expect(result).toBe('0m');
  });

  it('should return empty string for undefined cell value', () => {
    const props = {
      cell: undefined,
      config: { showSeconds: true }
    };
    const result = durationFormatterInstance.format(props);
    expect(result).toBe('');
  });

  it('should return empty string for null cell value', () => {
    const props = {
      cell: null,
      config: { showSeconds: true }
    };
    const result = durationFormatterInstance.format(props);
    expect(result).toBe('');
  });

  it('should return empty string for NaN cell value', () => {
    const props = {
      cell: NaN,
      config: { showSeconds: true }
    };
    const result = durationFormatterInstance.format(props);
    expect(result).toBe('');
  });

  it('should format duration correctly with negative milliseconds', () => {
    const props = {
      cell: -94545000, // - 1d 2h 15m 45s
      config: { showSeconds: true }
    };
    const result = durationFormatterInstance.format(props);
    expect(result).toBe('- 1d 2h 15m 45s');
  });

  it('should format duration of month', () => {
    const props = {
      cell: 2678400000 // 31d
    };
    const result = durationFormatterInstance.format(props);
    expect(result).toBe('31d');
  });

  it('should format duration greater then month', () => {
    const props = {
      cell: 3214443000 // 37d 4h 54m 3s
    };
    const result = durationFormatterInstance.format(props);
    expect(result).toBe('37d 4h 54m 3s');
  });

  it('should format duration greater then year', () => {
    const props = {
      cell: 36424470000 // 421d 13h 54m 30s
    };
    const result = durationFormatterInstance.format(props);
    expect(result).toBe('421d 13h 54m 30s');
  });

  it('should format duration max as hours enabled', () => {
    const props = {
      cell: 495000000, // 137h 30m or 5d 17h 30m
      config: { maxAsHours: true }
    };
    const result = durationFormatterInstance.format(props);
    expect(result).toBe('137h 30m');
  });

  it('should format duration max as hours disabled', () => {
    const props = {
      cell: 495000000, // 137h 30m or 5d 17h 30m
      config: { maxAsHours: false }
    };
    const result = durationFormatterInstance.format(props);
    expect(result).toBe('5d 17h 30m');
  });

  it('should format duration max as hours disabled by default', () => {
    const props = {
      cell: 495000000 // 137h 30m or 5d 17h 30m
    };
    const result = durationFormatterInstance.format(props);
    expect(result).toBe('5d 17h 30m');
  });

  describe('hoursPerDay (person-days mode)', () => {
    it('should format exact person-day', () => {
      // 8h = 1 person-day
      const props = { cell: 28800000, config: { hoursPerDay: 8 } };
      expect(durationFormatterInstance.format(props)).toBe('1d');
    });

    it('should format person-days with remaining hours', () => {
      // 10h = 1d 2h at 8h/day
      const props = { cell: 36000000, config: { hoursPerDay: 8 } };
      expect(durationFormatterInstance.format(props)).toBe('1d 2h');
    });

    it('should format multiple person-days', () => {
      // 16h = 2d at 8h/day
      const props = { cell: 57600000, config: { hoursPerDay: 8 } };
      expect(durationFormatterInstance.format(props)).toBe('2d');
    });

    it('should convert 24h to 3 person-days at 8h/day (not 1 calendar day)', () => {
      // 24h = 3d at 8h/day, vs 1d in calendar mode
      const props = { cell: 86400000, config: { hoursPerDay: 8 } };
      expect(durationFormatterInstance.format(props)).toBe('3d');
    });

    it('should format person-days with remaining hours and minutes', () => {
      // 10h 30m = 1d 2h 30m at 8h/day
      const props = { cell: 37800000, config: { hoursPerDay: 8 } };
      expect(durationFormatterInstance.format(props)).toBe('1d 2h 30m');
    });

    it('should format person-days with seconds when showSeconds enabled', () => {
      // 8h 30m 15s = 1d 30m 15s at 8h/day
      const props = { cell: 30615000, config: { hoursPerDay: 8, showSeconds: true } };
      expect(durationFormatterInstance.format(props)).toBe('1d 30m 15s');
    });

    it('should show only hours when less than one person-day', () => {
      // 5h < 8h/day → 0d, show 5h
      const props = { cell: 18000000, config: { hoursPerDay: 8 } };
      expect(durationFormatterInstance.format(props)).toBe('5h');
    });

    it('should support hoursPerDay as string (from JSON config)', () => {
      // 10h = 1d 2h at 8h/day
      const props = { cell: 36000000, config: { hoursPerDay: '8' } };
      expect(durationFormatterInstance.format(props)).toBe('1d 2h');
    });

    it('should format negative duration in person-days mode', () => {
      // -10h = -1d 2h at 8h/day
      const props = { cell: -36000000, config: { hoursPerDay: 8 } };
      expect(durationFormatterInstance.format(props)).toBe('- 1d 2h');
    });

    it('should ignore hoursPerDay when maxAsHours is true', () => {
      // maxAsHours takes priority — show raw hours only
      const props = { cell: 36000000, config: { hoursPerDay: 8, maxAsHours: true } };
      expect(durationFormatterInstance.format(props)).toBe('10h');
    });

    it('should not activate person-days mode when hoursPerDay is 0', () => {
      // hoursPerDay: 0 → calendar days (24h/day)
      const props = { cell: 86400000, config: { hoursPerDay: 0 } };
      expect(durationFormatterInstance.format(props)).toBe('1d');
    });

    it('should not activate person-days mode without hoursPerDay', () => {
      // no hoursPerDay → calendar days (24h/day), same as existing behaviour
      const props = { cell: 86400000 };
      expect(durationFormatterInstance.format(props)).toBe('1d');
    });

    it('should support custom hoursPerDay value (e.g. 6h workday)', () => {
      // 12h = 2d at 6h/day
      const props = { cell: 43200000, config: { hoursPerDay: 6 } };
      expect(durationFormatterInstance.format(props)).toBe('2d');
    });

    it('should fall back to calendar days when hoursPerDay is non-numeric string', () => {
      // invalid config value → disable person-days mode, use 24h/day
      const props = { cell: 86400000, config: { hoursPerDay: 'abc' } };
      expect(durationFormatterInstance.format(props)).toBe('1d');
    });
  });
});
