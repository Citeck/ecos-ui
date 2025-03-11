import React from 'react';
import get from 'lodash/get';
import isString from 'lodash/isString';
import isPlainObject from 'lodash/isPlainObject';

import BaseFormatter from '../../BaseFormatter';
import CellType from '../../CellType';

import './ValueColorFormatter.scss';

const HEX_COLOR_REGEX = /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/;
const SUPPORTED_DEFAULT_COLOR = ['green', 'yellow', 'pink', 'red'];

export default class ValueColorFormatter extends BaseFormatter {
  static TYPE = 'valueColor';

  static isHexColor(color) {
    return isString(color) && HEX_COLOR_REGEX.test(color);
  }

  format(props) {
    const { cell, config = {} } = props;
    const {
      colorMapping = {},
      enabledNewJournal = get(window, 'Citeck.constants.NEW_JOURNAL_ENABLED', false),
      showPointer = false,
      defaultColor = '#FFFFFF',
    } = config;

    let key, displayText;

    if (isPlainObject(cell)) {
      key = cell.value || '';
      displayText = cell.disp || key;
    } else {
      key = cell;
      displayText = cell;
    }

    let color = colorMapping[key];

    const isHexColor = ValueColorFormatter.isHexColor(color);

    // Check supported colors
    if (!isHexColor && color && !SUPPORTED_DEFAULT_COLOR.includes(color)) {
      console.warn(`ValueColorFormatter: Unsupported color "${color}". Use one of ${SUPPORTED_DEFAULT_COLOR.join(', ')} or HEX color.`);
    }

    let finalColor = color;
    if (!finalColor) {
      finalColor = defaultColor;
    }

    const isHexFinalColor = ValueColorFormatter.isHexColor(finalColor);
    const colorStyle = isHexFinalColor ? { backgroundColor: finalColor } : {};
    const colorClass = !isHexFinalColor && finalColor ? `value-color-formatter_${finalColor}` : '';

    // If defaultColor is not HEX, and it's a supported color, use its class
    const defaultIsHex = ValueColorFormatter.isHexColor(defaultColor);
    const defaultColorClass =
      !defaultIsHex && SUPPORTED_DEFAULT_COLOR.includes(defaultColor) ? `value-color-formatter_${defaultColor}` : '';

    // If there is no color and defaultColor is not HEX, use defaultColor class
    const finalColorClass = colorClass || (!isHexFinalColor && !color ? defaultColorClass : '');

    if (!displayText) {
      return <React.Fragment>{this.value(cell)}</React.Fragment>;
    }

    const ContentValue = enabledNewJournal ? (
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

    return ContentValue;
  }

  getSupportedCellType() {
    return CellType.ANY;
  }
}
