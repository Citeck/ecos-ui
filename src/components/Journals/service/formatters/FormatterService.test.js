import { mount } from 'enzyme';

import FormatterService from './FormatterService';
import formatterRegistry from './registry';

console.error = jest.fn();

const FORMATTER_TYPE_SCRIPT = 'script';
const FORMATTER_TYPE_UNKNOWN = 'unknown';

describe('FormatterService', () => {
  describe('format method', () => {
    it('should invoke formatter', () => {
      const scriptFormatterInstance = formatterRegistry.getFormatter(FORMATTER_TYPE_SCRIPT);
      const spy = jest.spyOn(scriptFormatterInstance, 'format');
      const result = FormatterService.format(
        { cell: 'abc' },
        {
          type: FORMATTER_TYPE_SCRIPT,
          config: {
            fn: 'return "OK"'
          }
        }
      );
      expect(spy).toHaveBeenCalled();
      expect(mount(result).text()).toBe('OK');
    });
    it('ScriptFormatter with various props', () => {
      const props = {
        cell: 'abc',
        row: {
          rowAtt: 'def'
        },
        fnArgs: {
          customArg: 'ghi'
        }
      };
      const resultWithFuncInConfig = FormatterService.format(props, {
        type: FORMATTER_TYPE_SCRIPT,
        config: {
          fn: function({ cell, row, customArg }) {
            return cell + '-' + row.rowAtt + '-' + customArg;
          }
        }
      });
      expect(mount(resultWithFuncInConfig).text()).toBe('abc-def-ghi');
      const resultWithScriptAsText = FormatterService.format(props, {
        type: FORMATTER_TYPE_SCRIPT,
        config: {
          fn: 'return cell + "-" + row.rowAtt + "-" + customArg'
        }
      });
      expect(mount(resultWithScriptAsText).text()).toBe('abc-def-ghi');
    });
    it('should replace placeholders in the config fields', () => {
      const result = FormatterService.format(
        {
          cell: 'abc',
          row: {
            rawAttributes: {
              a: 5,
              b: 10
            }
          }
        },
        {
          type: FORMATTER_TYPE_SCRIPT,
          config: {
            /* eslint-disable-next-line */
            fn: 'return ${a} + ${b}'
          }
        }
      );
      expect(mount(result).text()).toBe('15');
    });
    it('should display error message when formatter type is empty', () => {
      expect(FormatterService.format({}, {})).toBe(FormatterService.errorMessage);
    });
    it('should display error message when formatter type is invalid', () => {
      expect(FormatterService.format({}, { type: FORMATTER_TYPE_UNKNOWN })).toBe(FormatterService.errorMessage);
    });
    it('should display error message when formatter throws an Error', () => {
      // ScriptFormatter throws Error because config.script is not specified
      expect(FormatterService.format({ cell: 'abc' }, { type: FORMATTER_TYPE_SCRIPT })).toBe(FormatterService.errorMessage);
    });
  });
});
