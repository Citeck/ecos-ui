import React from 'react';
import DefaultGqlFormatter from '../DefaultGqlFormatter';
import isObject from 'lodash/isObject';

import './ColoredFormatter.scss';

export default class ColoredFormatter extends DefaultGqlFormatter {
  value(cell) {
    return cell.disp || cell._disp || '';
  }

  getId(cell) {
    return cell.str || cell._str || '';
  }

  render() {
    const { cell, params = {} } = this.props;
    const color = params.color || {};

    let cellColor = params.defaultColor || '#FFFFFF';
    let colorKey = isObject(cell) ? this.getId(cell) : cell;
    cellColor = color[colorKey] || cellColor;

    let style = {
      backgroundColor: cellColor
    };

    let text = '';
    if (params.hiddenText !== 'true') {
      text = this.value(cell);
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
}
