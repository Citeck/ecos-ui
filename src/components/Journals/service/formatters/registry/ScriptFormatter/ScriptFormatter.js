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
    const { config = {}, cell, row, fnArgs, valueIndex: index } = props;
    const script = config.fn;

    if (!script) {
      let strConfig = null;

      try {
        strConfig = JSON.stringify(config);
      } catch (e) {
        console.error("ScriptFormatter config can't be converted to string", config, e);
      }

      throw new Error(`"fn" is a mandatory parameter in the ScriptFormatter config. Current config: ${strConfig}`);
    }

    const vars = config.vars || {};
    let result;

    const args = { ...(fnArgs || {}), Records, _, t, vars, cell, row, index };

    if (_.isString(script)) {
      const entries = Object.entries(args);
      const fnArgNames = entries.map(e => e[0]);
      const fnArgValues = entries.map(e => e[1]);

      // eslint-disable-next-line
      result = new Function(...fnArgNames, script)(...fnArgValues);
    } else if (_.isFunction(script)) {
      result = script(args);
    } else {
      throw new Error('Unknown fn type: ' + typeof script);
    }

    if (_.isNil(script)) {
      return null;
    }

    const then = _.get(result, 'then');

    if (_.isFunction(then)) {
      return result.then(res => this._getResultByType(res, props));
    }

    return this._getResultByType(result, props);
  }

  _getResultByType(result, props) {
    switch (typeof result) {
      case 'boolean':
        return result ? t('boolean.yes') : t('boolean.no');
      case 'number':
      case 'string':
        return result;
      default:
        if (_.isPlainObject(result)) {
          const { format } = props;

          if (!_.isFunction(format)) {
            throw new Error(`"format" should be in props. Please don't use ScriptFormatter directly, use FormatterService instead`);
          }

          const newFormatter = _.omit(result, ['cell', 'row']);
          const newProps = _.clone(props);

          if (result.cell) {
            newProps.cell = result.cell;
          }

          if (result.row) {
            newProps.row = result.row;
          }

          return format(newProps, newFormatter);
        }

        return null;
    }
  }

  getSupportedCellType() {
    return CellType.ANY;
  }

  getAliases() {
    return ['FunctionFormatterV2', 'FunctionFormatter'];
  }
}
