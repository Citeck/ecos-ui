import * as util from '../../../../../../helpers/export/util';
import en from '../../../../../../i18n/en';

import Formatter from './ColoredFormatter';

const coloredFormatterInstance = new Formatter();

jest.spyOn(util, 't').mockImplementation((key) => en[key]);

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
        },
      });

      const color = result.props.style.backgroundColor;

      expect(color).toBe('#e2e2e2');
    });

    it('should return default color', () => {
      const result = coloredFormatterInstance.format({
        cell: { disp: '2', value: 2 },
        config: {
          fn: 'if (cell.value > 2) return "#e2e2e2"',
        },
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
            low: 'low',
          },
          enabledNewJournal: false,
          showPointer: false,
        };

        const result = coloredFormatterInstance.format({
          cell: 'low',
          config,
        });

        expect(result.props.className).toContain('value-color-formatter_low');
        expect(result.props.className).toContain('value-color-formatter__oval');
        expect(result.props.style).toEqual({});
        expect(result.props.children).toBe('low');
      });

      it('should apply background color with hex colors when showPointer = false', () => {
        const config = {
          color: {
            low: '#00FF00',
          },
          enabledNewJournal: false,
          showPointer: false,
        };

        const result = coloredFormatterInstance.format({
          cell: 'low',
          config,
        });

        expect(result.props.className).toContain('value-color-formatter__oval');
        expect(result.props.style).toEqual({ backgroundColor: '#00FF00' });
        expect(result.props.children).toBe('low');
      });

      it('should display pointer with named colors when showPointer = true', () => {
        const config = {
          color: {
            low: 'low',
          },
          enabledNewJournal: false,
          showPointer: true,
        };

        const result = coloredFormatterInstance.format({
          cell: 'low',
          config,
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
            low: '#00FF00',
          },
          enabledNewJournal: false,
          showPointer: true,
        };

        const result = coloredFormatterInstance.format({
          cell: 'low',
          config,
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
            low: 'low',
          },
          enabledNewJournal: true,
          showPointer: false,
        };

        const result = coloredFormatterInstance.format({
          cell: 'low',
          config,
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
            low: '#00FF00',
          },
          enabledNewJournal: true,
          showPointer: false,
        };

        const result = coloredFormatterInstance.format({
          cell: 'low',
          config,
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
            low: 'low',
          },
          enabledNewJournal: true,
          showPointer: true,
        };

        const result = coloredFormatterInstance.format({
          cell: 'low',
          config,
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
            low: '#00FF00',
          },
          enabledNewJournal: true,
          showPointer: true,
        };

        const result = coloredFormatterInstance.format({
          cell: 'low',
          config,
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
        enabledNewJournal: false,
      };

      const result = coloredFormatterInstance.format({
        cell: 'low',
        config,
      });

      expect(result.props.className).toContain('value-color-formatter__oval');
      expect(result.props.style).toEqual({ backgroundColor: '#CCCCCC' });
    });

    it('should use default named color when no color is provided', () => {
      const config = {
        color: {},
        defaultColor: 'green',
        showPointer: false,
        enabledNewJournal: false,
      };

      const result = coloredFormatterInstance.format({
        cell: 'low',
        config,
      });

      expect(result.props.className).toContain('value-color-formatter__oval');
      expect(result.props.className).toContain('value-color-formatter_green');
      expect(result.props.style).toEqual({});
    });

    it('should use value for mapping and disp for display when cell is an object', () => {
      const config = {
        color: {
          low: 'low',
        },
        showPointer: false,
        enabledNewJournal: false,
      };

      const result = coloredFormatterInstance.format({
        cell: { value: 'low', disp: 'Низкий' },
        config,
      });

      expect(result.props.className).toContain('value-color-formatter_low');
      expect(result.props.className).toContain('value-color-formatter__oval');
      expect(result.props.style).toEqual({});
      expect(result.props.children).toBe('Низкий');
    });

    it('should log warning for unsupported colors', () => {
      const config = {
        color: {
          low: 'unsupported-color',
        },
        showPointer: false,
        enabledNewJournal: false,
      };

      coloredFormatterInstance.format({
        cell: 'low',
        config,
      });

      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('ColoredFormatter: Unsupported color "unsupported-color"'));
    });
  });
});
