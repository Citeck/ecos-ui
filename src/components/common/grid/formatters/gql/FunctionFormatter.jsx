import React from 'react';
import DefaultGqlFormatter from './DefaultGqlFormatter';

export default class FunctionFormatter extends DefaultGqlFormatter {
  static getFilterValue(cell, row, params) {
    return this.prototype._format(this.prototype.value(cell), params);
  }

  _format(cell, params) {
    const { rowIndex, row } = this.props;
    const oRecord = row;
    const oColumn = {};
    const sData = this.value(cell);
    const elCell = document.createElement('div');

    elCell.innerText = sData;

    try {
      if (typeof params.fn === 'function') {
        params.fn(elCell, oRecord, oColumn, sData, rowIndex);
      } else if (typeof params.fn === 'string') {
        // eslint-disable-next-line
        const extractedFn = eval(`(function() { return ${params.fn}; })()`);
        if (typeof extractedFn === 'function') {
          extractedFn(elCell, oRecord, oColumn, sData, rowIndex);
        }
      }
    } catch (e) {
      console.groupCollapsed('ERROR FunctionFormatter');
      console.log("There is problem in Function Formatter. Check param 'fn'");
      console.error(e);
      console.warn(params.fn);
      console.groupEnd();
    }

    return elCell.innerHTML;
  }

  render() {
    let { cell, params } = this.props;

    return (
      <div
        dangerouslySetInnerHTML={{
          __html: this._format(cell, params)
        }}
      />
    );
  }
}
