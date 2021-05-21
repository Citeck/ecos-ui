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
    const { config } = props;
    if (!config.script) {
      throw new Error(`"script" is a mandatory parameter in the ScriptFormatter config. Current config: ${JSON.stringify(config)}`);
    }
    const vars = config.vars || {};

    /* eslint-disable-next-line */
    const result = new Function('Records', '_', 't', 'vars', 'props', config.script)(Records, _, t, vars, props);
    let content;

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
          if (typeof _.get(config, '_extra.format') !== 'function') {
            throw new Error(
              `"_extra.format" should be injected in config. Please don't use ScriptFormatter directly, use FormatterService instead`
            );
          }
          const newFormatter = _.omit(result, ['cell']);
          const newProps = _.clone(props);

          if (result.cell) {
            newProps.cell = result.cell;
          }

          content = config._extra.format(newProps, newFormatter);
        }
        break;
    }

    return content;
  }
}
