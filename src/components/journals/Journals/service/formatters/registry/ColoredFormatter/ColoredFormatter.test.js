import * as util from '@/helpers/export/util';
import en from '@/i18n/en';

import Formatter from './ColoredFormatter';

const coloredFormatterInstance = new Formatter();

jest.spyOn(util, 't').mockImplementation(key => en[key]);

describe('ColoredFormatter', () => {
  it('getType should return correct type', () => {
    expect(coloredFormatterInstance.getType()).toBe(Formatter.TYPE);
  });

  describe('isHexColor method', () => {
    it('should return true for valid hex colors', () => {
      expect(Formatter.isHexColor('#fff')).toBe(true);
      expect(Formatter.isHexColor('#FFF')).toBe(true);
      expect(Formatter.isHexColor('#000000')).toBe(true);
      expect(Formatter.isHexColor('#FF00FF')).toBe(true);
    });

    it('should return false for invalid hex colors', () => {
      expect(Formatter.isHexColor('fff')).toBe(false);
      expect(Formatter.isHexColor('#ffff')).toBe(false);
      expect(Formatter.isHexColor('#gggggg')).toBe(false);
      expect(Formatter.isHexColor('red')).toBe(false);
      expect(Formatter.isHexColor(null)).toBe(false);
      expect(Formatter.isHexColor(undefined)).toBe(false);
      expect(Formatter.isHexColor(123)).toBe(false);
    });
  });

  describe('format method - legacy mode', () => {
    it('should return colored value', () => {
      const result = coloredFormatterInstance.format({
        cell: { disp: '4', value: 4 },
        config: {
          fn: 'if (cell.value > 2) return "#e2e2e2"',
          enabledNewJournal: false
        }
      });

      const color = result.props.style.backgroundColor;

      expect(color).toBe('#e2e2e2');
    });

    it('should return default color', () => {
      const result = coloredFormatterInstance.format({
        cell: { disp: '2', value: 2 },
        config: {
          fn: 'if (cell.value > 2) return "#e2e2e2"',
          enabledNewJournal: false
        }
      });

      const color = result.props.style.backgroundColor;

      expect(color).toBe(Formatter.DEFAULT_COLOR);
    });
  });

  describe('formatValueColor method', () => {
    beforeEach(() => {
      console.warn = jest.fn();
    });

    describe('old journal format (enabledNewJournal = false)', () => {
      it('should apply background color with named colors when showPointer = false', () => {
        const config = {
          color: {
            low: 'low'
          },
          enabledNewJournal: false,
          showPointer: false
        };

        const result = coloredFormatterInstance.format({
          cell: 'low',
          config
        });

        expect(result.props.className).toContain('value-color-formatter_low');
        expect(result.props.className).toContain('value-color-formatter__oval');
        expect(result.props.style).toEqual({});
        expect(result.props.children).toBe('low');
      });

      it('should apply background color with hex colors when showPointer = false', () => {
        const config = {
          color: {
            low: '#00FF00'
          },
          enabledNewJournal: false,
          showPointer: false
        };

        const result = coloredFormatterInstance.format({
          cell: 'low',
          config
        });

        expect(result.props.className).toContain('value-color-formatter__oval');
        expect(result.props.style).toEqual({ backgroundColor: '#00FF00' });
        expect(result.props.children).toBe('low');
      });

      it('should display pointer with named colors when showPointer = true', () => {
        const config = {
          color: {
            low: 'low'
          },
          enabledNewJournal: false,
          showPointer: true
        };

        const result = coloredFormatterInstance.format({
          cell: 'low',
          config
        });

        expect(result.props.className).toBe('value-color-formatter');

        const pointer = result.props.children[0];
        expect(pointer.props.className).toContain('value-color-formatter__pointer');
        expect(pointer.props.className).toContain('value-color-formatter_low');
        expect(pointer.props.style).toEqual({});

        const textContainer = result.props.children[1];
        expect(textContainer.props.className).toBe('value-color-formatter__text');
        expect(textContainer.props.children).toBe('low');
      });

      it('should display pointer with hex colors when showPointer = true', () => {
        const config = {
          color: {
            low: '#00FF00'
          },
          enabledNewJournal: false,
          showPointer: true
        };

        const result = coloredFormatterInstance.format({
          cell: 'low',
          config
        });

        expect(result.props.className).toBe('value-color-formatter');

        const pointer = result.props.children[0];
        expect(pointer.props.className).toBe('value-color-formatter__pointer ');
        expect(pointer.props.style).toEqual({ backgroundColor: '#00FF00' });

        const textContainer = result.props.children[1];
        expect(textContainer.props.className).toBe('value-color-formatter__text');
        expect(textContainer.props.children).toBe('low');
      });
    });

    describe('new journal format (enabledNewJournal = true)', () => {
      it('should apply background color with named colors when showPointer = false', () => {
        const config = {
          color: {
            low: 'low'
          },
          enabledNewJournal: true,
          showPointer: false
        };

        const result = coloredFormatterInstance.format({
          cell: 'low',
          config
        });

        expect(result.props.className).toBe('value-color-formatter');

        const textContainer = result.props.children[1];
        expect(textContainer.props.className).toBe('value-color-formatter__text');

        const colorSpan = textContainer.props.children;
        expect(colorSpan.props.className).toContain('value-color-formatter__oval');
        expect(colorSpan.props.className).toContain('value-color-formatter_low');
        expect(colorSpan.props.children).toBe('low');
      });

      it('should apply background color with hex colors when showPointer = false', () => {
        const config = {
          color: {
            low: '#00FF00'
          },
          enabledNewJournal: true,
          showPointer: false
        };

        const result = coloredFormatterInstance.format({
          cell: 'low',
          config
        });

        expect(result.props.className).toBe('value-color-formatter');

        const textContainer = result.props.children[1];
        expect(textContainer.props.className).toBe('value-color-formatter__text');

        const colorSpan = textContainer.props.children;
        expect(colorSpan.props.className).toBe('value-color-formatter__oval');
        expect(colorSpan.props.style).toEqual({ backgroundColor: '#00FF00' });
        expect(colorSpan.props.children).toBe('low');
      });

      it('should display only pointer with named colors when showPointer = true', () => {
        const config = {
          color: {
            low: 'low'
          },
          enabledNewJournal: true,
          showPointer: true
        };

        const result = coloredFormatterInstance.format({
          cell: 'low',
          config
        });

        expect(result.props.className).toBe('value-color-formatter');

        const pointer = result.props.children[0];
        expect(pointer.props.className).toContain('value-color-formatter__pointer');
        expect(pointer.props.className).toContain('value-color-formatter_low');
        expect(pointer.props.style).toEqual({});

        const textContainer = result.props.children[1];
        expect(textContainer.props.className).toBe('value-color-formatter__text');
        expect(textContainer.props.children).toBe('low');
      });

      it('should display only pointer with hex colors when showPointer = true', () => {
        const config = {
          color: {
            low: '#00FF00'
          },
          enabledNewJournal: true,
          showPointer: true
        };

        const result = coloredFormatterInstance.format({
          cell: 'low',
          config
        });

        expect(result.props.className).toBe('value-color-formatter');

        const pointer = result.props.children[0];
        expect(pointer.props.className).toBe('value-color-formatter__pointer ');
        expect(pointer.props.style).toEqual({ backgroundColor: '#00FF00' });

        const textContainer = result.props.children[1];
        expect(textContainer.props.className).toBe('value-color-formatter__text');
        expect(textContainer.props.children).toBe('low');
      });
    });

    it('should use default color when no color is provided', () => {
      const config = {
        color: {},
        defaultColor: '#CCCCCC',
        showPointer: false,
        enabledNewJournal: false
      };

      const result = coloredFormatterInstance.format({
        cell: 'low',
        config
      });

      expect(result.props.className).toContain('value-color-formatter__oval');
      expect(result.props.style).toEqual({ backgroundColor: '#CCCCCC' });
    });

    it('should use default named color when no color is provided', () => {
      const config = {
        color: {},
        defaultColor: 'green',
        showPointer: false,
        enabledNewJournal: false
      };

      const result = coloredFormatterInstance.format({
        cell: 'low',
        config
      });

      expect(result.props.className).toContain('value-color-formatter__oval');
      expect(result.props.style).toEqual({ backgroundColor: '#24A148' });
    });

    it('should use value for mapping and disp for display when cell is an object', () => {
      const config = {
        color: {
          low: 'low'
        },
        showPointer: false,
        enabledNewJournal: false
      };

      const result = coloredFormatterInstance.format({
        cell: { value: 'low', disp: 'Низкий' },
        config
      });

      expect(result.props.className).toContain('value-color-formatter_low');
      expect(result.props.className).toContain('value-color-formatter__oval');
      expect(result.props.style).toEqual({});
      expect(result.props.children).toBe('Низкий');
    });

    it('should use unsupported color as CSS class', () => {
      const config = {
        color: {
          low: 'unsupported-color'
        },
        showPointer: false,
        enabledNewJournal: false
      };

      const result = coloredFormatterInstance.format({
        cell: 'low',
        config
      });

      expect(result.props.className).toContain('value-color-formatter_unsupported-color');
      expect(result.props.style).toEqual({});
    });
  });

  describe('config.colors (new format with background and text color)', () => {
    it('should apply background and text color from colors[key] (old journal)', () => {
      const config = {
        colors: {
          low: { backgroundColor: '#00FF00', color: '#FF0000' }
        },
        showPointer: false,
        enabledNewJournal: false
      };

      const result = coloredFormatterInstance.format({ cell: 'low', config });

      expect(result.props.className).toContain('value-color-formatter__oval');
      expect(result.props.style).toEqual({ backgroundColor: '#00FF00', color: '#FF0000' });
      expect(result.props.children).toBe('low');
    });

    it('should apply background and text color from colors[key] (new journal)', () => {
      const config = {
        colors: {
          low: { backgroundColor: '#00FF00', color: '#FF0000' }
        },
        showPointer: false,
        enabledNewJournal: true
      };

      const result = coloredFormatterInstance.format({ cell: 'low', config });

      const textContainer = result.props.children[1];
      const colorSpan = textContainer.props.children;

      expect(colorSpan.props.className).toBe('value-color-formatter__oval');
      expect(colorSpan.props.style).toEqual({ backgroundColor: '#00FF00', color: '#FF0000' });
      expect(colorSpan.props.children).toBe('low');
    });

    it('should prefer colors over color for the same value', () => {
      const config = {
        color: {
          low: '#000000'
        },
        colors: {
          low: { backgroundColor: '#00FF00', color: '#FF0000' }
        },
        showPointer: false,
        enabledNewJournal: false
      };

      const result = coloredFormatterInstance.format({ cell: 'low', config });

      expect(result.props.style).toEqual({ backgroundColor: '#00FF00', color: '#FF0000' });
    });

    it('should resolve named background color from colors to hex', () => {
      const config = {
        colors: {
          low: { backgroundColor: 'green', color: '#FFFFFF' }
        },
        showPointer: false,
        enabledNewJournal: false
      };

      const result = coloredFormatterInstance.format({ cell: 'low', config });

      expect(result.props.style).toEqual({ backgroundColor: '#24A148', color: '#FFFFFF' });
    });

    it('should fall back to defaultColor for background when colors[key] has only text color', () => {
      const config = {
        colors: {
          low: { color: '#FF0000' }
        },
        defaultColor: '#CCCCCC',
        showPointer: false,
        enabledNewJournal: false
      };

      const result = coloredFormatterInstance.format({ cell: 'low', config });

      expect(result.props.style).toEqual({ backgroundColor: '#CCCCCC', color: '#FF0000' });
    });

    it('should apply text color to the text span and background to the pointer when showPointer = true (old journal)', () => {
      const config = {
        colors: {
          low: { backgroundColor: '#00FF00', color: '#FF0000' }
        },
        showPointer: true,
        enabledNewJournal: false
      };

      const result = coloredFormatterInstance.format({ cell: 'low', config });

      const pointer = result.props.children[0];
      const textContainer = result.props.children[1];

      expect(pointer.props.style).toEqual({ backgroundColor: '#00FF00' });
      expect(textContainer.props.style).toEqual({ color: '#FF0000' });
      expect(textContainer.props.children).toBe('low');
    });

    it('should apply text color to the text span and background to the pointer when showPointer = true (new journal)', () => {
      const config = {
        colors: {
          low: { backgroundColor: '#00FF00', color: '#FF0000' }
        },
        showPointer: true,
        enabledNewJournal: true
      };

      const result = coloredFormatterInstance.format({ cell: 'low', config });

      const pointer = result.props.children[0];
      const textContainer = result.props.children[1];

      expect(pointer.props.style).toEqual({ backgroundColor: '#00FF00' });
      expect(textContainer.props.style).toEqual({ color: '#FF0000' });
      expect(textContainer.props.children).toBe('low');
    });

    it('should fall back to legacy color for values absent in colors', () => {
      const config = {
        color: {
          high: '#00FF00'
        },
        colors: {
          low: { backgroundColor: '#0000FF', color: '#FFFFFF' }
        },
        showPointer: false,
        enabledNewJournal: false
      };

      const result = coloredFormatterInstance.format({ cell: 'high', config });

      expect(result.props.style).toEqual({ backgroundColor: '#00FF00' });
    });
  });

  it('should pass rowIndex to the color script', () => {
    const result = coloredFormatterInstance.format({
      cell: { disp: 'low', value: 'low' },
      rowIndex: 3,
      config: {
        fn: 'if (rowIndex === 3) return "#e2e2e2"'
      }
    });

    expect(result.props.style.backgroundColor).toBe('#e2e2e2');
  });

  describe('data-value attribute for theme styling', () => {
    it('should set data-value on root element (old journal, oval)', () => {
      const result = coloredFormatterInstance.format({
        cell: 'low',
        config: { showPointer: false, enabledNewJournal: false }
      });

      expect(result.props['data-value']).toBe('low');
    });

    it('should set data-value on root element (old journal, pointer)', () => {
      const result = coloredFormatterInstance.format({
        cell: 'low',
        config: { showPointer: true, enabledNewJournal: false }
      });

      expect(result.props['data-value']).toBe('low');
    });

    it('should set data-value on root element (new journal)', () => {
      const result = coloredFormatterInstance.format({
        cell: 'low',
        config: { showPointer: false, enabledNewJournal: true }
      });

      expect(result.props['data-value']).toBe('low');
    });

    it('should use cell.value for data-value when cell is an object', () => {
      const result = coloredFormatterInstance.format({
        cell: { value: 'low', disp: 'Низкий' },
        config: { showPointer: false, enabledNewJournal: false }
      });

      expect(result.props['data-value']).toBe('low');
    });
  });
});
