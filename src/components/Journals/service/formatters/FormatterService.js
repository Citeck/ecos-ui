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
   * @param {Formatter} formatter
   * @return {React.ReactNode}
   */
  static format(props = {}, formatter = {}) {
    try {
      return this._formatImpl(props, formatter);
    } catch (e) {
      console.error('[FormattersService.format] error', e);
      return FormatterService.errorMessage;
    }
  }

  static _formatImpl(props = {}, formatter = {}) {
    const { row, cell } = props;
    const { type, config } = formatter;

    if (!type) {
      console.error('[FormattersService.format] empty formatter type', formatter);
      return FormatterService.errorMessage;
    }

    let modifiedConfig = cloneDeep(config);
    if (row && row.rawAttributes && size(row.rawAttributes) > 0) {
      modifiedConfig = replacePlaceholders(modifiedConfig, row.rawAttributes);
    }

    const fmtInstance = formatterRegistry.getFormatter(type);
    if (!fmtInstance || typeof fmtInstance.format !== 'function') {
      console.error('[FormattersService.format] invalid formatter', fmtInstance);
      return FormatterService.errorMessage;
    }

    const formatProps = {
      ...props,
      config: modifiedConfig,
      format: FormatterService.format
    };

    if (Array.isArray(cell)) {
      return cell.map(elem => FormatterService._formatSingleValueCellImpl(elem, formatProps, fmtInstance));
    } else {
      return FormatterService._formatSingleValueCellImpl(cell, formatProps, fmtInstance);
    }
  }

  static _formatSingleValueCellImpl(cell, formatProps, fmtInstance) {
    formatProps.cell = cell;
    try {
      return fmtInstance.format(formatProps);
    } catch (e) {
      console.error('[FormattersService._formatSingleValueCellImpl] error', e);
      return FormatterService.errorMessage;
    }
  }
}

export default FormatterService;
