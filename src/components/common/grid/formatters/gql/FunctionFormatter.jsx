import React, { Fragment } from 'react';
import DefaultGqlFormatter from './DefaultGqlFormatter';

export default class FunctionFormatter extends DefaultGqlFormatter {
  static getFilterValue(cell, row, params) {
    return this.prototype._format(this.prototype.value(cell), params);
  }

  _format(value, params) {
    let elCell = {};
    let oRecord = {};
    let oColumn = {};
    let sData = value;

    if (typeof params.fn === 'function') {
      params.fn(elCell, oRecord, oColumn, sData);
    }

    return elCell.innerHTML || value;
  }

  render() {
    let { cell, params } = this.props;

    return <Fragment>{this._format(this.value(cell), params)}</Fragment>;
  }
}
