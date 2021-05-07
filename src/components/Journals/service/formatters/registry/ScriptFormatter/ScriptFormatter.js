import React from 'react';
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
    const { config = {}, cell, format } = props;
    const script = config.fn;
    if (!script) {
      throw new Error(`"fn" is a mandatory parameter in the ScriptFormatter config. Current config: ${JSON.stringify(config)}`);
    }
    const vars = config.vars || {};

    /* eslint-disable-next-line */
    const result = new Function('Records', '_', 't', 'vars', 'cell', script)(Records, _, t, vars, cell);
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

    return <this.PopperWrapper text={content}>{content}</this.PopperWrapper>;
  }

  getSupportedCellType() {
    return CellType.ANY;
  }

  getAliases() {
    return ['FunctionFormatterV2', 'FunctionFormatter'];
  }
}
