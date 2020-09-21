import lodashGet from 'lodash/get';

import { getCurrentLocale, t } from '../../../../helpers/util';
import ecosFetch from '../../../../helpers/ecosFetch';
import Records from '../../../Records';
import formatterStore from '../formatters/formatterStore';
import Mapper from '../mapping/Mapper';
import BaseDataSource, { DEFAULT_FORMATTER } from './BaseDataSource';
import AttributesService from '../../../../services/AttributesService';

/**
 * @deprecated see JournalsService
 */
export default class GqlDataSource extends BaseDataSource {
  constructor(options) {
    super(options);

    this.options.ajax.body = this._getBodyJson(this.options.ajax.body, this.options.columns, this.options.permissions);
    this._columns = this._getColumns(this.options.columns);
    this._createVariants = this.options.createVariants;
  }

  getColumns() {
    return this._columns;
  }

  load() {
    const options = this.options;

    return Records.query(JSON.parse(options.ajax.body))
      .then(resp => {
        return {
          data: resp.records,
          total: resp.totalCount,
          attributes: resp.attributes
        };
      })
      .catch(err => {
        console.error(err);
        return this._legacyLoad();
      });
  }

  _legacyLoad() {
    let options = this.options;
    return ecosFetch(options.url, options.ajax)
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

  static getColumnsStatic(columns) {
    return columns.map((column, idx) => {
      const newColumn = { ...column };
      const formatterOptions = column.formatter || Mapper.getFormatterOptions(newColumn, idx);
      const { formatter, params } = GqlDataSource.getFormatterStatic(formatterOptions);

      newColumn.dataField = newColumn.dataField || newColumn.attribute;
      newColumn.text = t(newColumn.text || newColumn.dataField);
      newColumn.formatExtraData = { formatter, params };
      newColumn.filterValue = (cell, row) => formatter.getFilterValue(cell, row, params);
      newColumn.editorRenderer = formatter.getEditor;

      return newColumn;
    });
  }

  _getBodyJson(body, columns, permissions) {
    let defaultBody = {
      attributes: {
        ...this._getAttributes(columns),
        ...this._getPermissions(permissions)
      }
    };

    return JSON.stringify({ ...defaultBody, ...body });
  }

  _getAttributes(columns) {
    const attributes = {};

    columns.forEach((column, idx) => {
      const formatterOptions = column.formatter || Mapper.getFormatterOptions(column, idx);
      const { formatter } = this._getFormatter(formatterOptions);

      attributes[column.dataField || column.attribute] = column.schema || formatter.getQueryString(column.attribute || column.dataField);
    });

    attributes.hasContent = '.has(n:"cm:content")';

    const groupAtts = lodashGet(this.options || {}, 'ajax.body.query.groupBy', []);

    for (let i = 0; i < groupAtts.length; i++) {
      const att = groupAtts[i];
      attributes['groupBy_' + att] = att + '?str';
    }

    return attributes;
  }

  _getPermissions = AttributesService.getPermissions;

  static getFormatterStatic(options) {
    const defaultFormatter = formatterStore[DEFAULT_FORMATTER];
    let name;
    let params;

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
    return {
      columns: [],
      url: undefined,
      ajax: {
        method: 'post',
        headers: {
          'Accept-Language': getCurrentLocale(),
          'Content-type': 'application/json; charset=UTF-8'
        },
        credentials: 'include',
        body: {}
      }
    };
  }
}
