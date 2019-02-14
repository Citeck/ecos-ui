import React from 'react';
import BaseDataSource from './BaseDataSource';
import formatterStore from '../formatters/formatterStore';
import Mapper from '../mapping/Mapper';

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
    return fetch(options.url, options.ajax)
      .then(response => {
        return response.json();
      })
      .then(resp => {
        let recordsData = resp.records || [];
        let total = resp.totalCount || 0;
        let data = [];

        for (let i = 0; i < recordsData.length; i++) {
          let recordData = recordsData[i];
          let attribute = recordData.attributes;

          attribute._gid = i; //Служебный ключ. Нужен чтобы работал Grid
          attribute._recordId = recordData.id || i;

          data.push(attribute);
        }

        return { data, total };
      });
  }

  _getColumns(columns) {
    columns = columns.map((column, idx) => {
      column.dataField = column.dataField || column.attribute;
      column.text = column.text || column.dataField;
      column.hidden = !column.default;

      column.formatter = column.formatter || Mapper.getFormatterOptions(column, idx);

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
      attributes: this._getAttributes(columns)
    };

    return JSON.stringify({ ...defaultBody, ...body });
  }

  _getAttributes(columns) {
    let attributes = {};

    columns.forEach((column, idx) => {
      column.formatter = column.formatter || Mapper.getFormatterOptions(column, idx);

      let { formatter } = this._getFormatter(column.formatter);
      let dataField = column.dataField || '';
      attributes[dataField || column.attribute] = column.attribute || formatter.getQueryString(dataField) || dataField;
    });

    return attributes;
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
