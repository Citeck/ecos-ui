import BaseDataSource from './BaseDataSource';
import formatterStore from '../formatters/formatterStore';
import Mapper from '../mapping/Mapper';
import Records from '../../../Records';

const DEFAULT_FORMATTER = 'DefaultGqlFormatter';

export default class GqlDataSource extends BaseDataSource {
  constructor(options) {
    super(options);

    this._createVariants = this.options.createVariants;
    this.options.ajax.body = this._getBodyJson(this.options.ajax.body, this.options.columns);
    this._columns = this._getColumns(this.options.columns);
  }

  getColumns() {
    return this._columns;
  }

  load() {
    let options = this.options;

    return Records.query(JSON.parse(options.ajax.body))
      .then(resp => {
        return {
          data: resp.records,
          total: resp.totalCount
        };
      })
      .catch(err => {
        console.error(err);
        return this._legacyLoad();
      });
  }

  _legacyLoad() {
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
          const recordData = recordsData[i];
          const recordDataId = recordData.id;

          data.push({
            ...recordData.attributes,
            id: data.filter(item => item.id === recordDataId).length ? recordDataId + i : recordDataId
          });
        }

        return { data, total };
      });
  }

  _getColumns(columns) {
    return columns.map((column, idx) => {
      let newColumn = { ...column };

      newColumn.dataField = newColumn.dataField || newColumn.attribute;
      newColumn.text = window.Alfresco.util.message(newColumn.text || newColumn.dataField);

      let formatterOptions = newColumn.formatter || Mapper.getFormatterOptions(newColumn, idx);
      let { formatter, params } = this._getFormatter(formatterOptions);

      newColumn.formatExtraData = { formatter, params, createVariants: this._createVariants };

      newColumn.filterValue = (cell, row) => formatter.getFilterValue(cell, row, params);
      newColumn.editorRenderer = formatter.getEditor;

      return newColumn;
    });
  }

  static getColumnsStatic(columns) {
    return columns.map((column, idx) => {
      let newColumn = { ...column };

      newColumn.dataField = newColumn.dataField || newColumn.attribute;
      newColumn.text = window.Alfresco.util.message(newColumn.text || newColumn.dataField);

      let formatterOptions = newColumn.formatter || Mapper.getFormatterOptions(newColumn, idx);
      let { formatter, params } = GqlDataSource.getFormatterStatic(formatterOptions);

      newColumn.formatExtraData = { formatter, params };

      newColumn.filterValue = (cell, row) => formatter.getFilterValue(cell, row, params);
      newColumn.editorRenderer = formatter.getEditor;

      return newColumn;
    });
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
      let formatterOptions = column.formatter || Mapper.getFormatterOptions(column, idx);
      let { formatter } = this._getFormatter(formatterOptions);

      attributes[column.dataField || column.attribute] = column.schema || formatter.getQueryString(column.attribute || column.dataField);
    });

    return attributes;
  }

  _getFormatter(options) {
    let name;
    let params;
    let defaultFormatter = formatterStore[DEFAULT_FORMATTER];

    if (options) {
      ({ name, params } = options);
    }

    let formatter = formatterStore[name || options] || defaultFormatter;

    params = params || {};

    return {
      formatter,
      params
    };
  }

  static getFormatterStatic(options) {
    let name;
    let params;
    let defaultFormatter = formatterStore[DEFAULT_FORMATTER];

    if (options) {
      ({ name, params } = options);
    }

    let formatter = formatterStore[name || options] || defaultFormatter;

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
