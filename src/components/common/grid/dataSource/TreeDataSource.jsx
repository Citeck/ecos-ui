import BaseDataSource from './BaseDataSource';
import formatterStore from '../formatters/formatterStore';
import Mapper from '../mapping/Mapper';
import { RecordService } from '../../../../api/recordService';

const DEFAULT_FORMATTER = 'DefaultGqlFormatter';

export default class TreeDataSource extends BaseDataSource {
  constructor(options) {
    super(options);

    this._api = new RecordService({});
    this._createVariants = this.options.createVariants;
    this._columns = this._getColumns(this.options.columns);
  }

  getColumns() {
    return this._columns;
  }

  load() {
    return this._api
      .query({
        query: {
          query: JSON.stringify({
            field_0: 'type',
            predicate_0: 'type-equals',
            value_0: '{http://www.citeck.ru/model/contracts/1.0}agreement'
          }),
          language: 'criteria',
          groupBy: ['cm:title']
        },
        attributes: {
          sum: 'sum(contracts:agreementAmount)',
          value: '.att(n:"predicate"){val:att(n:"value"){str}}',
          children: '.att(n:"values"){atts(n:"records"){att(n:"cm:title"){str}}}'
        }
      })
      .then(resp => {
        console.log(resp);

        let recordsData = resp.records || [];
        let total = resp.totalCount || 0;
        let data = [];

        for (let i = 0; i < recordsData.length; i++) {
          let recordData = recordsData[i];

          data.push({
            ...recordData.attributes,
            id: recordData.id || i
          });
        }

        return { data, total };
      });
  }

  _getColumns(columns) {
    columns = [
      {
        dataField: 'value',
        text: 'Поле'
      },
      {
        dataField: 'sum',
        text: 'Сумма'
      }
    ];

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
