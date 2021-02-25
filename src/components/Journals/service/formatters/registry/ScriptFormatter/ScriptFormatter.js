import _ from 'lodash';
import Records from '../../../../../Records';
import { t } from '../../../../../../helpers/export/util';

import BaseFormatter from '../BaseFormatter';

/**
 * @typedef {FormatterProps} ScriptFormatterProps
 * @field {String}    config.script         - script to be executed
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
    const { config, cell, format } = props;
    if (!config.script) {
      throw new Error(`"script" is a mandatory parameter in the ScriptFormatter config. Current config: ${JSON.stringify(config)}`);
    }
    const vars = config.vars || {};

    /* eslint-disable-next-line */
    const result = new Function('Records', '_', 't', 'vars', 'cell', config.script)(Records, _, t, vars, cell);

    switch (typeof result) {
      case 'boolean':
        return result ? t('boolean.yes') : t('boolean.no');
      case 'number':
      case 'string':
        return result;
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

          return format(newProps, newFormatter);
        }
        break;
    }

    return null;
  }
}
