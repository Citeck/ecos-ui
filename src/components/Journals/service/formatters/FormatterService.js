import React from 'react';
import cloneDeep from 'lodash/cloneDeep';
import size from 'lodash/size';
import isEmpty from 'lodash/isEmpty';
import isPlainObject from 'lodash/isPlainObject';

import { t } from '../../../../helpers/export/util';
import { replacePlaceholders } from '../util';
import formatterRegistry from './registry';
import CellType from './CellType';

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
      return FormatterService._formatImpl(props, formatter);
    } catch (e) {
      console.error('[FormattersService.format] error', props, formatter, e);
      return FormatterService.errorMessage;
    }
  }

  static _convertLegacyFormatterData(formatter = {}) {
    const { type, name, config, params } = formatter;
    const newFormatter = { ...formatter };

    if (isEmpty(formatter) || (!type && !name)) {
      return {};
    }

    newFormatter.config = config || params || {};

    if (!type) {
      newFormatter.type = name || 'default';
    }

    return newFormatter;
  }

  static _formatImpl(props = {}, formatter = {}) {
    const { row, cell } = props;
    const { type, config } = FormatterService._convertLegacyFormatterData(formatter);

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
      console.error('[FormattersService.format] invalid formatter with type: ' + type, fmtInstance);
      return FormatterService.errorMessage;
    }

    const formatProps = {
      ...props,
      config: modifiedConfig,
      format: FormatterService.format
    };

    if (Array.isArray(cell)) {
      if (cell.length === 1) {
        return FormatterService._formatSingleValueCellImpl(cell[0], formatProps, fmtInstance);
      }

      let idx = 0;

      return cell.map(elem => {
        return <div key={idx++}>{FormatterService._formatSingleValueCellImpl(elem, formatProps, fmtInstance)}</div>;
      });
    } else {
      return FormatterService._formatSingleValueCellImpl(cell, formatProps, fmtInstance);
    }
  }

  static _formatSingleValueCellImpl(cell, formatProps, fmtInstance) {
    if (cell == null) {
      return '';
    }
    let cellValue = cell;
    if (fmtInstance.getSupportedCellType() === CellType.VALUE_WITH_DISP) {
      if (!isPlainObject(cellValue)) {
        cellValue = { value: cellValue, disp: cellValue };
      } else {
        cellValue = {
          value: cellValue.value || null,
          disp: cellValue.disp || cellValue.value || null
        };
      }
    } else if (fmtInstance.getSupportedCellType() === CellType.SCALAR) {
      if (isPlainObject(cellValue) && cellValue.value) {
        cellValue = cellValue.value;
      }
    }
    formatProps.cell = cellValue;
    try {
      return fmtInstance.format(formatProps);
    } catch (e) {
      console.error('[FormattersService._formatSingleValueCellImpl] error. Props: ', formatProps, e);
      return FormatterService.errorMessage;
    }
  }
}

export default FormatterService;
