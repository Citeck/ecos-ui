import React from 'react';
import BaseDataSource from './BaseDataSource';
import formatterStore from '../formatters/formatterStore';

const DEFAULT_FORMATTER = 'DefaultGqlFormatter';

export default class GqlDataSource extends BaseDataSource {
  constructor(options) {
    super(options);

    this.options.ajax.body = this._getBodyJson(this.options.ajax.body, this.options.columns);
    this._columns = this._getColumns(this.options.columns);
  }

  getColumns() {
    return this._columns;
  }

  load() {
    let options = this.options;
    return fetch(options.url, options.ajax).then(response => {
      return response.json();
    });
  }

  _getColumns(columns) {
    columns = columns.map((column, idx) => {
      column.dataField = column.id || this._getIdByIdx(idx);

      let { formatter, params } = this._getFormatter(column.formatter);
      column.formatter = (cell, row) => {
        let Formatter = formatter;
        return <Formatter row={row} cell={cell} params={params} />;
      };

      column.filterValue = (cell, row) => formatter.getFilterValue(cell, row, params);

      return column;
    });

    return columns;
  }

  _getBodyJson(body, columns) {
    let defaultBody = {
      schema: this._getSchema(columns)
    };

    return JSON.stringify({ ...defaultBody, ...body });
  }

  _getSchema(columns) {
    let gqlSchemes = columns.map((column, idx) => {
      let { formatter } = this._getFormatter(column.formatter);
      let str = formatter.getQueryString();

      return `id, ${this._getIdByIdx(idx)}: edge(n: "${column.field}") {name, val:vals {${str}}}`;
    });

    return gqlSchemes.join(',');
  }

  _getFormatter(options) {
    let name;
    let params;

    if (options) {
      ({ name, params } = options);
    }

    let formatter = formatterStore[name || options || DEFAULT_FORMATTER];

    params = params || {};

    return {
      formatter,
      params
    };
  }

  _getIdByIdx(idx) {
    return `a${idx}`;
  }

  _getDefaultOptions() {
    const options = {
      columns: [],
      url: undefined,
      ajax: {
        method: 'post',
        headers: {
          'Content-type': 'application/json; charset=UTF-8'
        },
        credentials: 'include',
        body: {}
      }
    };

    return options;
  }
}
