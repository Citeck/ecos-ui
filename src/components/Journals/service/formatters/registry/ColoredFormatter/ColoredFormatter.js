import React from 'react';

import './ColoredFormatter.scss';

import BaseFormatter from '../BaseFormatter';
import CellType from '../../CellType';

export default class ColoredFormatter extends BaseFormatter {
  static TYPE = 'colored';

  format(props) {
    const { cell, config = {} } = props;
    const color = config.color || {};

    let cellColor = config.defaultColor || '#FFFFFF';
    cellColor = color[cell.value || ''] || cellColor;

    let style = {
      backgroundColor: cellColor
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
