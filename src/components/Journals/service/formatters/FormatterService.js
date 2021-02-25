import cloneDeep from 'lodash/cloneDeep';
import size from 'lodash/size';

import { t } from '../../../../helpers/export/util';
import { replacePlaceholders } from '../util';
import formatterRegistry from './registry';

/**
 * @typedef {Object} FormatterConfig
 *
 * @typedef {Object} Formatter
 * @field {String}                type
 * @field {FormatterInnerConfig}  config
 *
 * @typedef {Object} FormatterServiceProps
 * @field {Any}     cell      - Cell data
 * @field {Object}  row       - Current row data
 * @field {Number}  rowIndex  - Row index
 * @field {Object}  column    - Column config
 *
 * @typedef {FormatterServiceProps & {config: FormatterConfig}} FormatterProps
 */

class FormatterService {
  static get errorMessage() {
    return `#${t('error').toUpperCase()}`;
  }

  /**
   * @param {FormatterServiceProps} props
   * @param {Formatter} newFormatter
   * @return {React.ReactNode}
   */
  static format(props = {}, newFormatter = {}) {
    const { row } = props;
    const { type, config } = newFormatter;

    try {
      if (!type) {
        console.error('[FormattersService.format] empty formatter type', newFormatter);
        return FormatterService.errorMessage;
      }

      let modifiedConfig = cloneDeep(config);
      if (row && row.rawAttributes && size(row.rawAttributes) > 0) {
        modifiedConfig = replacePlaceholders(modifiedConfig, row.rawAttributes);
      }

      const formatter = formatterRegistry.getFormatter(type);
      if (!formatter || typeof formatter.format !== 'function') {
        console.error('[FormattersService.format] invalid formatter', formatter);
        return FormatterService.errorMessage;
      }

      return formatter.format({
        ...props,
        config: {
          ...modifiedConfig,
          _extra: {
            format: FormatterService.format
          }
        }
      });
    } catch (e) {
      console.error('[FormattersService.format] error', e);
      return FormatterService.errorMessage;
    }
  }
}

export default FormatterService;
