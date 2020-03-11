import { RecordService } from '../../../../api/recordService';
import BaseDataSource from './BaseDataSource';

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
    return (
      this._api
        //todo: replace to using Records.js
        .query({
          query: {
            query: JSON.stringify({
              field_0: 'type',
              predicate_0: 'type-equals',
              value_0: '{http://www.citeck.ru/model/contracts/1.0}agreement'
            }),
            language: 'criteria',
            groupBy: ['cm:title', 'cm:create']
          },
          attributes: {
            sum: 'sum(contracts:agreementAmount)',
            value: '.att(n:"predicate"){val:att(n:"value"){str}}',
            children: '.att(n:"values"){atts(n:"records"){att(n:"cm:title"){str}}}'
          }
        })
        .then(resp => {
          let recordsData = resp.records || [];
          let total = resp.totalCount || 0;
          let data = [];

          for (let i = 0; i < recordsData.length; i++) {
            let recordData = recordsData[i];

            data.push({
              ...recordData.attributes,
              id: i //recordData.id || i
            });
          }

          return { data, total };
        })
    );
  }

  _getColumns() {
    const columns = [
      {
        dataField: 'value',
        text: 'Заголовок'
      },
      {
        dataField: 'sum',
        text: 'Сумма'
      }
    ];

    return super._getColumns(columns);
  }

  _getDefaultOptions() {
    return {
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
  }
}
