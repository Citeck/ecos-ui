import React from 'react';
import isString from 'lodash/isString';
import isFunction from 'lodash/isFunction';
import isEmpty from 'lodash/isEmpty';

import BaseFormatter from '../../BaseFormatter';
import CellType from '../../CellType';
import Records from '../../../../../Records';

import './ColoredFormatter.scss';

export default class ColoredFormatter extends BaseFormatter {
  static TYPE = 'colored';

  static DEFAULT_TEXT_COLOR = '#000000';

  format(props) {
    const { cell, row, config = {}, valueIndex: index } = props;
    const color = config.color || ColoredFormatter.DEFAULT_TEXT_COLOR;
    const script = config.fn;

    let backgroundColor = config.defaultColor || '#FFFFFF';
    if (!isString(color)) {
      backgroundColor = color[cell.value || ''] || backgroundColor;
    }

    let style = {
      color: isString(color) ? color : undefined,
      backgroundColor
    };

    let text = '';

    if (config.textHidden !== true) {
      text = cell.disp;
    } else {
      style['display'] = 'table';
      style['margin'] = '0 auto';
    }

    const args = { Records, cell, row, index };

    /**
     * @type {?String} HEX or RGB(A) value
     */
    let scriptResult;

    if (!isEmpty(script)) {
      if (isString(script)) {
        const entries = Object.entries(args);
        const fnArgNames = entries.map(e => e[0]);
        const fnArgValues = entries.map(e => e[1]);

        // eslint-disable-next-line
        scriptResult = new Function(...fnArgNames, script)(...fnArgValues);
      } else if (isFunction(script)) {
        scriptResult = script(args);
      } else {
        throw new Error('Unknown fn type: ' + typeof script);
      }
    }

    if (scriptResult) {
      style = { ...style, color: scriptResult };
    }

    return (
      <span style={style} className={`colored-formatter`}>
        {text}
      </span>
    );
  }

  getSupportedCellType() {
    return CellType.VALUE_WITH_DISP;
  }
}
