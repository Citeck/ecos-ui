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
});
