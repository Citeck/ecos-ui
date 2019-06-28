import _ from 'lodash';
import BaseComponent from '../base/BaseComponent';
import Formio from 'formiojs/Formio';

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
        eventName: '',
        executionCondition: '',
        refreshOn: [],
        source: {
          type: '',
          ajax: {
            method: '',
            url: '',
            data: '',
            mapping: ''
          },
          record: {
            id: '',
            attributes: {}
          },
          recordsArray: {
            id: '',
            attributes: {}
          },
          recordsQuery: {
            query: '',
            attributes: {},
            isSingle: false
          },
          custom: {
            syncData: {},
            asyncData: {}
          }
        },
        update: {
          type: '',
          event: '',
          rate: 100,
          force: false
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

    let shouldUpdate = true;
    if (comp.executionCondition) {
      shouldUpdate = this.evaluate(comp.executionCondition, {}, 'value', true);
    }

    if (shouldUpdate) {
      this._updateValue(false);
    }

    return result;
  }

  get visible() {
    return false;
  }

  _updateValue(forceUpdate) {
    let comp = this.component;
    let type = _.get(comp, 'source.type', '');
    let self = this;

    switch (type) {
      case 'record':
        let recordId = _.get(comp, 'source.record.id', '');
        if (recordId) {
          recordId = this.interpolate(recordId, { item: this.rootValue });
        }

        this._evalAsyncValue(
          'evaluatedRecordId',
          recordId,
          id => {
            return Records.get(id).load(comp.source.record.attributes);
          },
          {},
          forceUpdate
        );

        break;
      case 'recordsArray':
        let recordIds = _.get(comp, 'source.recordsArray.id', '');
        if (recordIds) {
          recordIds = this.interpolate(recordIds, { item: this.rootValue });
        }

        this._evalAsyncValue(
          'evaluatedRecordIds',
          recordIds,
          ids => {
            if (!ids) {
              return [];
            }

            return Promise.all(ids.split(',').map(id => Records.get(id).load(comp.source.recordsArray.attributes)));
          },
          {},
          forceUpdate
        );

        break;
      case 'recordsQuery':
        let recQueryConfig = _.get(comp, 'source.recordsQuery', {});

        let query = this.evaluate(recQueryConfig.query, {}, 'value', true);

        this._evalAsyncValue(
          'evaluatedRecordsQuery',
          query,
          query => {
            let attributes = recQueryConfig.attributes || {};

            if (recQueryConfig.isSingle) {
              return Records.queryOne(query, attributes);
            } else {
              return Records.query({
                query: query,
                attributes: attributes
              });
            }
          },
          {},
          forceUpdate
        );

        break;
      case 'ajax':
        let ajaxConfig = _.get(comp, 'source.ajax', {});
        let reqData = this.evaluate(ajaxConfig.data, {}, 'value', true);

        this._evalAsyncValue(
          'computedAjaxData',
          reqData,
          data => {
            let url = ajaxConfig.url;
            let body = null;
            if (ajaxConfig.method === 'GET') {
              url += '?' + Formio.serialize(data);
            } else {
              body = JSON.stringify(data);
            }

            if (url.substr(0, 1) === '/') {
              let baseUrl = Formio.getProjectUrl();
              if (!baseUrl) {
                baseUrl = Formio.getBaseUrl();
              }
              url = baseUrl + url;
            }

            return fetch(url, {
              method: ajaxConfig.method,
              credentials: 'include',
              headers: {
                'Content-type': 'application/json;charset=UTF-8'
              },
              body: body
            })
              .then(response => {
                return response.json();
              })
              .then(response => {
                if (ajaxConfig.mapping) {
                  return self.evaluate(ajaxConfig.mapping, { data: response }, 'value', true);
                } else {
                  return response;
                }
              });
          },
          null,
          forceUpdate
        );

        break;

      case 'custom':
        let customConfig = _.get(comp, 'source.custom', {});
        let syncData = this.evaluate(customConfig.syncData, {}, 'value', true);

        this._evalAsyncValue(
          'computedCustomData',
          syncData,
          data => {
            return this.evaluate(customConfig.asyncData, { data: data }, 'value', true);
          },
          null,
          forceUpdate
        );

        break;
      default:
        console.error('Unknown source type: ' + type);
    }
  }

  _evalAsyncValue(dataField, data, action, defaultValue, forceUpdate) {
    let self = this;
    let comp = this.component;

    if (data === null) {
      return;
    }

    let currentValue = this[dataField];
    if (forceUpdate || !_.isEqual(currentValue, data)) {
      this[dataField] = data;

      let actionImpl = () => {
        if (data === self[dataField]) {
          let result = action.call(self, data);
          if (result) {
            if (result.then) {
              result
                .then(data => {
                  self.setValue(data);
                })
                .catch(e => {
                  console.warn(e);
                  self.setValue(defaultValue);
                });
            } else {
              self.setValue(result);
            }
          }
        }
      };

      if (forceUpdate) {
        actionImpl.call(this);
      } else {
        setTimeout(actionImpl, comp.update.rate);
      }
    }
  }

  build() {
    super.build();

    if (this.options.builder) {
      // We need to see it in builder mode.
      this.append(this.text(this.name + ' (' + this.key + ')'));
    }

    if (_.get(this.component, 'update.type', '') === 'event') {
      this.on(
        this.component.update.event,
        () => {
          const isForceUpdate = _.get(this.component, 'update.force', false);
          this._updateValue(isForceUpdate);
        },
        true
      );
    }

    const refreshOn = _.get(this.component, 'refreshOn', []);
    if (Array.isArray(refreshOn) && refreshOn.length > 0) {
      this.on(
        'change',
        event => {
          if (
            event.changed &&
            event.changed.component &&
            (refreshOn.findIndex(item => item.value === event.changed.component.key) !== -1) &
              // Make sure the changed component is not in a different "context". Solves issues where refreshOn being set
              // in fields inside EditGrids could alter their state from other rows (which is bad).
              this.inContext(event.changed.instance)
          ) {
            this._updateValue(false);
          }
        },
        true
      );
    }
  }

  viewOnlyBuild() {} // hide control for viewOnly mode

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
      this.triggerEventOnChange();
      return true;
    }
    return false;
  }

  getValue() {
    return this.dataValue;
  }

  triggerEventOnChange = () => {
    const component = this.component;
    if (component.eventName) {
      this.emit(this.interpolate(component.eventName), this.data);
      this.events.emit(this.interpolate(component.eventName), this.data);
      this.emit('customEvent', {
        type: this.interpolate(component.eventName),
        component: this.component,
        data: this.data,
        event: null
      });
    }
  };
}
