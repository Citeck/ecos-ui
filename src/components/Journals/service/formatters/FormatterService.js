import React from 'react';
import cloneDeep from 'lodash/cloneDeep';
import size from 'lodash/size';
import isPlainObject from 'lodash/isPlainObject';
import isFunction from 'lodash/isFunction';
import isString from 'lodash/isString';

import { t } from '../../../../helpers/export/util';
import { replacePlaceholders, valueOrNull } from '../util';
import formatterRegistry from './registry';
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
      console.error('[FormattersService.format] error', props, formatter, e);
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

    if (!fmtInstance || !isFunction(fmtInstance.format)) {
      console.error('[FormattersService.format] invalid formatter with type: ' + type, fmtInstance);
      return FormatterService.errorMessage;
    }

    const formatProps = {
      ...props,
      config: modifiedConfig,
      format: FormatterService.format
    };

    const formatSingleValue = (data, valueIndex = 0) =>
      FormatterService._formatSingleValueCellImpl(data, { ...formatProps, valueIndex }, fmtInstance);

    if (Array.isArray(cell)) {
      if (cell.length === 1) {
        return formatSingleValue(cell[0]);
      }

      return cell.map((elem, i) => <div key={i}>{formatSingleValue(elem, i)}</div>);
    }

    return formatSingleValue(cell);
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
      // Sometimes Formatter.js returns an empty string,
      // so you need to check if the contentComponent is empty.
      // If the contentComponent is empty, then you need to return the plain text.

      const contentComponent = fmtInstance.format(formatProps);

      if (!contentComponent && isString(formatProps.cell)) {
        return <FormatterService.PopperWrapper text={formatProps.cell} />;
      } else {
        return <FormatterService.PopperWrapper contentComponent={contentComponent} />;
      }
    } catch (e) {
      console.error('[FormattersService._formatSingleValueCellImpl] error. Props: ', formatProps, e);
      return FormatterService.errorMessage;
    }
  }
}

export default FormatterService;
