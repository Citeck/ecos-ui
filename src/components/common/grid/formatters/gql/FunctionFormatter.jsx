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

    if (typeof params.fn === 'function') {
      params.fn(elCell, oRecord, oColumn, sData, rowIndex);
    } else if (typeof params.fn === 'string') {
      try {
        // eslint-disable-next-line
        const extractedFn = eval(`(function() { return ${params.fn}; })()`);
        if (typeof extractedFn === 'function') {
          extractedFn(elCell, oRecord, oColumn, sData, rowIndex);
        }
      } catch (e) {
        console.error(`FunctionFormatter error: ${e.message}`);
      }
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
