import React from 'react';
import isString from 'lodash/isString';

import './ColoredFormatter.scss';

import BaseFormatter from '../../BaseFormatter';
import CellType from '../../CellType';

export default class ColoredFormatter extends BaseFormatter {
  static TYPE = 'colored';

  format(props) {
    const { cell, config = {} } = props;
    const color = config.color || '#000000';

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
