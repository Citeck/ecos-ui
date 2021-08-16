import React from 'react';

import DefaultGqlFormatter from './DefaultGqlFormatter';

export default class FunctionFormatter extends DefaultGqlFormatter {
  static getFilterValue(cell, row, params, rowIndex) {
    return this.prototype._format(this.prototype.value(cell), row, params, rowIndex);
  }

  _format(cell, row, params, rowIndex = this.props.rowIndex) {
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
        const extractedFn = eval(`(function() {
          return ${params.fn};
        })()`);
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

  renderContent() {
    const { cell, row, params } = this.props;

    return <div dangerouslySetInnerHTML={{ __html: this._format(cell, row, params) }} />;
  }

  render() {
    return <this.PopperWrapper contentComponent={this.renderContent()} />;
  }
}
