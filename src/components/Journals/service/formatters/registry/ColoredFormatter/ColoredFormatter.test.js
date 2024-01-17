import * as util from '../../../../../../helpers/export/util';
import en from '../../../../../../i18n/en';

import Formatter from './ColoredFormatter';

const coloredFormatterInstance = new Formatter();

jest.spyOn(util, 't').mockImplementation(key => en[key]);

describe('ColoredFormatter', () => {
  it('getType should return correct type', () => {
    expect(coloredFormatterInstance.getType()).toBe(Formatter.TYPE);
  });

  describe('format method', () => {
    it('should return colored value', () => {
      const result = coloredFormatterInstance.format({
        cell: { disp: '4', value: 4 },
        config: {
          fn: 'if (cell.value > 2) return "#e2e2e2"'
        }
      });

      const { color } = result.props.style;

      expect(color).toBe('#e2e2e2');
    });

    it('should return default color', () => {
      const result = coloredFormatterInstance.format({
        cell: { disp: '2', value: 2 },
        config: {
          fn: 'if (cell.value > 2) return "#e2e2e2"'
        }
      });

      const { color } = result.props.style;

      expect(color).toBe(Formatter.DEFAULT_TEXT_COLOR);
    });
  });
});
