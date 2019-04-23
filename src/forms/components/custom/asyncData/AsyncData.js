import _ from 'lodash';
import BaseComponent from '../base/BaseComponent';

import Records from '../../../../components/Records';

export default class AsyncDataComponent extends BaseComponent {
  static schema(...extend) {
    return BaseComponent.schema(
      {
        label: 'Async Data',
        key: 'asyncData',
        type: 'asyncData',
        mask: false,
        inputType: 'asyncData',
        source: {
          type: '',
          ajax: '',
          record: {
            id: '',
            attributes: {}
          },
          records: {
            query: '',
            attributes: {}
          }
        },
        update: {
          type: '',
          event: '',
          rate: 100
        }
      },
      ...extend
    );
  }

  static get builderInfo() {
    return {
      title: 'Async Data',
      icon: 'fa fa-terminal',
      group: 'data',
      weight: 0,
      schema: AsyncDataComponent.schema()
    };
  }

  get defaultSchema() {
    return AsyncDataComponent.schema();
  }

  elementInfo() {
    const info = super.elementInfo();
    info.type = 'input';
    info.attr.type = 'hidden';
    info.changeEvent = 'change';
    return info;
  }

  checkConditions(data) {
    let result = super.checkConditions(data);
    let comp = this.component;

    if (_.get(comp, 'update.type', '') !== 'any-change') {
      return result;
    }

    let type = _.get(comp, 'source.type', '');
    let self = this;

    switch (type) {
      case 'record':
        let recordId = _.get(comp, 'source.record.id', '');
        if (recordId) {
          recordId = this.interpolate(recordId, { item: data });
        }

        this._evalAsyncValue(
          'evaluatedRecordId',
          recordId,
          id => {
            return Records.get(id).load(comp.source.record.attributes);
          },
          {}
        );

        break;
      case 'records':
        let queryFunc = _.get(comp, 'source.records.query', '');
        let query = this.evaluate(queryFunc, {}, 'value', true);

        this._evalAsyncValue(
          'evaluatedRecordsQuery',
          query,
          query => {
            return Records.query({
              query: query,
              attributes: comp.source.records.attributes
            });
          },
          {}
        );

        break;
      case 'ajax':
        let method = _.get(comp, 'source.ajax.method', 'GET');

        let reqDataFunc = _.get(comp, 'source.ajax.method', '');
        let reqData = this.evaluate(reqDataFunc, {}, 'value', true);

        console.log('Ajax');
        break;
      default:
        console.error('Unknown source type: ' + type);
    }
    return result;
  }

  _evalAsyncValue(dataField, data, action, defaultValue) {
    let self = this;
    let comp = this.component;

    let currentValue = this[dataField];
    if (!_.isEqual(currentValue, data)) {
      this[dataField] = data;

      setTimeout(() => {
        if (data === self[dataField]) {
          let result = action.call(self, data);
          if (result) {
            result
              .then(data => {
                self.setValue(data);
              })
              .catch(() => {
                self.setValue(defaultValue);
              });
          }
        }
      }, comp.update.rate);
    }
  }

  build() {
    super.build();
    if (this.options.builder) {
      // We need to see it in builder mode.
      this.append(this.text(this.name));
    }
  }

  createLabel() {}

  get emptyValue() {
    return {};
  }

  setValue(value, flags) {
    if (!_.isEqual(this.dataValue, value)) {
      flags = this.getFlags.apply(this, arguments);
      this.dataValue = value;
      this.updateValue(flags);
      this.triggerChange(flags);
      return true;
    }
    return false;
  }

  getValue() {
    return this.dataValue;
  }

  isEmpty(value) {
    return _.isEqual(value, {});
  }
}
