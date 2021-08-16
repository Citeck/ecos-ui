import _ from 'lodash';
import get from 'lodash/get';

import Records from '../../../../../Records';
import { t } from '../../../../../../helpers/export/util';
import BaseFormatter from '../BaseFormatter';
import CellType from '../../CellType';
import ecosFetch from '../../../../../../helpers/ecosFetch';

/**
 * @typedef {FormatterProps} ScriptFormatterProps
 * @field {String}    config.fn             - script to be executed
 * @field {Object}    config.vars           - variables that should be available when the script executing (in the "vars" variable)
 * @field {Object}    config._extra         - extra arguments, injected by FormatterService
 * @field {function}  config._extra.format  - alias for FormatterService.format
 */

export default class ScriptFormatter extends BaseFormatter {
  static TYPE = 'script';

  /**
   * @param {ScriptFormatterProps} props
   * @return {React.ReactNode}
   */
  format(props) {
    const { config = {}, cell, format, rowIndex, row } = props;
    const script = config.fn;
    if (!script) {
      throw new Error(`"fn" is a mandatory parameter in the ScriptFormatter config. Current config: ${JSON.stringify(config)}`);
    }
    const vars = config.vars || {};
    const args = [cell, row, {}, cell, rowIndex, { lodash: _, ecosFetch, Records, _, t, ...vars }];
    let result;
    let content;

    if (typeof script === 'function') {
      result = script(...args);

      const then = get(result, 'then');

      if (typeof then === 'function') {
        return result;
      }
    }

    if (typeof script === 'string') {
      try {
        // eslint-disable-next-line
        const extractedFn = eval(`(function() { return function (cell, row, column, data, rowIndex, utils) { ${script};}})()`);

        if (typeof extractedFn === 'function') {
          result = extractedFn(...args);
        }
      } catch (e) {
        console.error('String script Error => ', e);
      }
    }

    switch (typeof result) {
      case 'boolean':
        content = result ? t('boolean.yes') : t('boolean.no');
        break;
      case 'number':
      case 'string':
        content = result;
        break;
      default:
        if (_.isPlainObject(result)) {
          if (typeof format !== 'function') {
            throw new Error(`"format" should be in props. Please don't use ScriptFormatter directly, use FormatterService instead`);
          }
          const newFormatter = _.omit(result, ['cell']);
          const newProps = _.clone(props);

          if (result.cell) {
            newProps.cell = result.cell;
          }

          content = format(newProps, newFormatter);
        }
        break;
    }

    return content;
  }

  getSupportedCellType() {
    return CellType.ANY;
  }

  getAliases() {
    return ['FunctionFormatterV2', 'FunctionFormatter'];
  }
}
