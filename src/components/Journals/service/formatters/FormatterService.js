import React from 'react';
import cloneDeep from 'lodash/cloneDeep';
import size from 'lodash/size';

import Popper from '../../../common/Popper';
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

      const formatProps = {
        ...props,
        config: {
          ...modifiedConfig,
          _extra: {
            format: FormatterService.format
          }
        }
      };

      return <FormatterService.PopperWrapper contentComponent={formatter.format(formatProps)} />;
    } catch (e) {
      console.error('[FormattersService.format] error', e);
      return FormatterService.errorMessage;
    }
  }
}

export default FormatterService;
