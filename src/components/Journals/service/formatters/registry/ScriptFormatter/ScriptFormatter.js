import _ from 'lodash';

import Records from '../../../../../Records';
import { t } from '../../../../../../helpers/export/util';
import BaseFormatter from '../BaseFormatter';
import CellType from '../../CellType';

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
    const { config = {}, cell, row } = props;
    let script = config.fn;

    if (!script) {
      throw new Error(`"fn" is a mandatory parameter in the ScriptFormatter config. Current config: ${JSON.stringify(config)}`);
    }

    const vars = config.vars || {};
    const args = [Records, _, t, vars, cell, row];
    let result;

    if (typeof script === 'string') {
      try {
        // eslint-disable-next-line
        result = new Function('Records', '_', 't', 'vars', 'cell', 'row', script)(...args);
      } catch (e) {
        console.error('String script Error => ', e);
      }
    }

    if (typeof script === 'function') {
      result = script(...args);

      const then = _.get(result, 'then');

      if (typeof then === 'function') {
        return result.then(res => this.getResultByType(res, props));
      }
    }

    return this.getResultByType(result, props);
  }

  getResultByType(result, props) {
    switch (typeof result) {
      case 'boolean':
        return result ? t('boolean.yes') : t('boolean.no');
      case 'number':
      case 'string':
        return result;
      default:
        if (_.isPlainObject(result)) {
          const { format } = props;

          if (typeof format !== 'function') {
            throw new Error(`"format" should be in props. Please don't use ScriptFormatter directly, use FormatterService instead`);
          }
          const newFormatter = _.omit(result, ['cell']);
          const newProps = _.clone(props);
          if (result.cell) {
            newProps.cell = result.cell;
          }

          return format(newProps, newFormatter);
        }
        break;
    }

    return null;
  }

  getSupportedCellType() {
    return CellType.ANY;
  }

  getAliases() {
    return ['FunctionFormatterV2', 'FunctionFormatter'];
  }
}
