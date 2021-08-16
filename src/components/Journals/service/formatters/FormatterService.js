import React from 'react';
import cloneDeep from 'lodash/cloneDeep';
import size from 'lodash/size';
import get from 'lodash/get';

import { t } from '../../../../helpers/export/util';
import { replacePlaceholders, valueOrNull } from '../util';
import formatterRegistry from './registry';
import isPlainObject from 'lodash/isPlainObject';
import CellType from './CellType';
import Popper from '../../../common/Popper';

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

  static PopperWrapper(props) {
    return (
      <Popper
        showAsNeeded
        icon="icon-question"
        popupClassName="formatter-popper"
        text={props.text}
        contentComponent={props.contentComponent}
      >
        {props.children}
      </Popper>
    );
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
      console.error('[FormattersService.format] error', e);
      return FormatterService.errorMessage;
    }
  }

  static getTypeByName(formatterName) {
    switch (formatterName) {
      case 'FunctionFormatterV2':
      case 'FunctionFormatter':
      case 'ScriptFormatter':
        return 'script';
      default:
        return 'default';
    }
  }

  static _formatImpl(props = {}, formatter = {}) {
    const { row, cell } = props;
    const { type } = formatter;
    const config = get(formatter, 'config', get(formatter, 'params'));

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
          value: valueOrNull(cellValue.value),
          disp: valueOrNull(cellValue.disp || cellValue.value)
        };
      }
    } else if (fmtInstance.getSupportedCellType() === CellType.SCALAR) {
      if (isPlainObject(cellValue) && cellValue.value) {
        cellValue = cellValue.value;
      }
    }
    formatProps.cell = cellValue;
    try {
      return <FormatterService.PopperWrapper contentComponent={fmtInstance.format(formatProps)} />;
    } catch (e) {
      console.error('[FormattersService._formatSingleValueCellImpl] error', e);
      return FormatterService.errorMessage;
    }
  }
}

export default FormatterService;
