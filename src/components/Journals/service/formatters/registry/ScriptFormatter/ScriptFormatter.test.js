import * as util from '../../../../../../helpers/export/util';
import en from '../../../../../../i18n/en';

import ScriptFormatter from './ScriptFormatter';

const scriptFormatterInstance = new ScriptFormatter();

jest.spyOn(util, 't').mockImplementation(key => en[key]);

describe('ScriptFormatter', () => {
  it('getType should return correct type', () => {
    expect(scriptFormatterInstance.getType()).toBe(ScriptFormatter.TYPE);
  });
  describe('format method', () => {
    it('should return Yes if the script result is boolean (true)', () => {
      const result = scriptFormatterInstance.format({
        config: {
          script: 'return true;'
        }
      });
      expect(result).toBe('Yes');
    });
    it('should return No if the script result is boolean (false)', () => {
      const result = scriptFormatterInstance.format({
        config: {
          script: 'return false;'
        }
      });
      expect(result).toBe('No');
    });
    it('should return number if the script result is number', () => {
      const result = scriptFormatterInstance.format({
        config: {
          script: 'return 1 + 2;'
        }
      });
      expect(result).toBe(3);
    });
    it('should return string if the script result is string', () => {
      const result = scriptFormatterInstance.format({
        config: {
          script: 'return "Test";'
        }
      });
      expect(result).toBe('Test');
    });
    it('should invoke other formatter, if the script result is plain object', () => {
      const formatFunc = jest.fn();
      const modifiedCell = 'Modified cell';
      scriptFormatterInstance.format({
        cell: 'Original cell',
        config: {
          script: `
            return {
              type: 'html',
              config: {
                html: '<div>Test</div>'
              },
              cell: '${modifiedCell}'
            };
          `
        },
        format: formatFunc
      });
      expect(formatFunc).toHaveBeenCalled();

      const args = formatFunc.mock.calls[0];
      const newProps = args[0];
      const newFormatter = args[1];

      expect(newProps.cell).toBe(modifiedCell);
      expect(newFormatter.type).toBe('html');
      expect(newFormatter.config.html).toBe('<div>Test</div>');
    });
    it('should return null in other cases', () => {
      const returnVariants = [null, undefined];
      returnVariants.forEach(item => {
        const result = scriptFormatterInstance.format({
          config: {
            script: `return ${item}`
          }
        });
        expect(result).toBe(null);
      });
      const result = scriptFormatterInstance.format({
        config: {
          script: `/* no return operator */`
        }
      });
      expect(result).toBe(null);
    });
    it('should throw Error if config.script is not specified', () => {
      const format = () => {
        scriptFormatterInstance.format({
          config: {}
        });
      };
      expect(format).toThrow('mandatory');
    });
  });
});
