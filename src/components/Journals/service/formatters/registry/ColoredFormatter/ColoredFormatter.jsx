import get from 'lodash/get';
import isBoolean from 'lodash/isBoolean';
import isEmpty from 'lodash/isEmpty';
import isFunction from 'lodash/isFunction';
import isNil from 'lodash/isNil';
import isPlainObject from 'lodash/isPlainObject';
import isString from 'lodash/isString';
import React from 'react';

import Records from '../../../../../Records';
import BaseFormatter from '../../BaseFormatter';
import CellType from '../../CellType';

import { t } from '@/helpers/util';

import './ColoredFormatter.scss';

const HEX_COLOR_REGEX = /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/;
const SUPPORTED_DEFAULT_COLOR = ['green', 'yellow', 'pink', 'red'];

export default class ColoredFormatter extends BaseFormatter {
  static TYPE = 'colored';

  static DEFAULT_COLOR = '#FFFFFF';

  static isHexColor(color) {
    return isString(color) && HEX_COLOR_REGEX.test(color);
  }

  format(props) {
    const { cell, row, config = {}, valueIndex: index } = props;
    const {
      color = {},
      enabledNewJournal = get(window, 'Citeck.constants.NEW_JOURNAL_ENABLED', false),
      showPointer = false,
      defaultColor = ColoredFormatter.DEFAULT_COLOR
    } = config;

    let key, displayText;

    if (isPlainObject(cell)) {
      key = !isNil(cell.value) ? cell.value : '';
      displayText = !isNil(cell.disp) ? cell.disp : key;
    } else {
      key = cell;
      displayText = cell;
    }

    let colorByScript = this.colorByScript({ Records, cell, row, index }, config.fn);
    let finalColor = colorByScript || color[key] || defaultColor;

    const isHexColor = ColoredFormatter.isHexColor(finalColor);

    // Check supported colors
    if (!isHexColor && finalColor && !SUPPORTED_DEFAULT_COLOR.includes(finalColor)) {
      console.warn(`ColoredFormatter: Unsupported color "${finalColor}". Use one of ${SUPPORTED_DEFAULT_COLOR.join(', ')} or HEX color.`);
    }

    const isHexFinalColor = ColoredFormatter.isHexColor(finalColor);
    const colorStyle = isHexFinalColor ? { backgroundColor: finalColor } : {};
    const colorClass = !isHexFinalColor && finalColor ? `value-color-formatter_${finalColor}` : '';

    // If defaultColor is not HEX, and it's a supported color, use its class
    const defaultIsHex = ColoredFormatter.isHexColor(defaultColor);
    const defaultColorClass =
      !defaultIsHex && SUPPORTED_DEFAULT_COLOR.includes(defaultColor) ? `value-color-formatter_${defaultColor}` : '';

    // If there is no color and defaultColor is not HEX, use defaultColor class
    const finalColorClass = colorClass || (!isHexFinalColor && !finalColor ? defaultColorClass : '');

    if (isNil(displayText)) {
      return <React.Fragment>{this.value(cell)}</React.Fragment>;
    }

    if (isBoolean(displayText)) {
      displayText = t(`boolean.${displayText ? 'yes' : 'no'}`);
    }

    return enabledNewJournal ? (
      <div className="value-color-formatter">
        {showPointer ? (
          <span
            className={`value-color-formatter__pointer ${!isHexFinalColor ? finalColorClass : ''}`}
            style={isHexFinalColor ? colorStyle : {}}
          />
        ) : null}
        <span className="value-color-formatter__text">
          {!showPointer ? (
            isHexFinalColor ? (
              <span className="value-color-formatter__oval" style={colorStyle}>
                {displayText}
              </span>
            ) : (
              <span className={`value-color-formatter__oval ${finalColorClass}`}>{displayText}</span>
            )
          ) : (
            displayText
          )}
        </span>
      </div>
    ) : !showPointer ? (
      <span
        className={`value-color-formatter value-color-formatter__oval ${!isHexFinalColor ? finalColorClass : ''}`}
        style={isHexFinalColor ? colorStyle : {}}
      >
        {displayText}
      </span>
    ) : (
      <div className="value-color-formatter">
        <span
          className={`value-color-formatter__pointer ${!isHexFinalColor ? finalColorClass : ''}`}
          style={isHexFinalColor ? colorStyle : {}}
        />
        <span className="value-color-formatter__text">{displayText}</span>
      </div>
    );
  }

  colorByScript(args, script) {
    let scriptResult = '';

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

    return scriptResult;
  }

  getSupportedCellType() {
    return CellType.VALUE_WITH_DISP;
  }
}
