import _ from 'lodash';
import Formio from 'formiojs/Formio';
import BaseComponent from '../base/BaseComponent';
import ecosFetch from '../../../../helpers/ecosFetch';
import Records from '../../../../components/Records';

let ajaxGetCache = {};

const UT = {
  ANY: 'any-change',
  ONCE: 'once',
  EVENT: 'event'
};

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
        ignoreValuesEqualityChecking: false,
        source: {
          type: '',
          forceLoad: false,
          ajax: {
            method: 'GET',
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
          recordsScript: {
            script: '',
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

  static optimizeSchema(comp) {
    const defaultSchema = AsyncDataComponent.schema();
    return {
      ...comp,
      source: _.omitBy(comp.source, (value, key) => {
        if (['type', 'forceLoad'].includes(key)) {
          return false;
        }
        return key !== comp.source.type;
      }),
      update: _.omitBy(comp.update, (value, key) => _.isEqual(defaultSchema.update[key], value))
    };
  }

  updatedOnce = false;

  get defaultSchema() {
    return AsyncDataComponent.schema();
  }

  get visible() {
    return false;
  }

  get shouldExecute() {
    const executionCondition = _.get(this.component, 'executionCondition');

    if (executionCondition) {
      return this.evaluate(executionCondition, {}, 'value', true);
    }

    return true;
  }

  get emptyValue() {
    return {};
  }

  get updateType() {
    return _.get(this.component, 'update.type', '');
  }

  isReadyToSubmit() {
    return this.activeAsyncActionsCounter === 0;
  }

  elementInfo() {
    const info = super.elementInfo();
    info.type = 'input';
    info.attr.type = 'hidden';
    info.changeEvent = 'change';
    return info;
  }

  checkConditions(data) {
    const result = super.checkConditions(data);

    if (this.shouldExecute) {
      if (this.updateType === UT.ANY) {
        this._updateValue(false);
      }
      if (this.updateType === UT.ONCE && !this.updatedOnce) {
        this.updatedOnce = true;
        this._updateValue(false);
      }
    }

    return result;
  }

  _loadAtts(recordId, attributes) {
    if (!this._recordWatchers) {
      this._recordWatchers = {};
    }

    const record = Records.get(recordId);
    const baseRecord = record.getBaseRecord();
    const callback = () => this._updateValue();

    let attributesMap;
    if (_.isArray(attributes)) {
      attributesMap = {};
      for (let att of attributes) {
        attributesMap[att] = att;
      }
    } else {
      attributesMap = attributes;
    }

    let watcher = this._recordWatchers[recordId];
    if (!watcher) {
      watcher = baseRecord.watch(attributesMap, callback);
      this._recordWatchers[record.id] = watcher;
    } else {
      let watchedAtts = watcher.getWatchedAttributes();
      let isAllRequiredAttsWatched = true;
      for (let attName in attributesMap) {
        if (attributesMap.hasOwnProperty(attName) && !watchedAtts[attName]) {
          watchedAtts[attName] = attributesMap[attName];
          isAllRequiredAttsWatched = false;
          break;
        }
      }
      if (!isAllRequiredAttsWatched) {
        watcher.unwatch();
        watcher = baseRecord.watch(watchedAtts);
        this._recordWatchers[record.id] = watcher;
      }
    }

    const force = _.get(this.component, 'source.forceLoad', false);
    return record.load(attributes, force);
  }

  _updateValue(forceUpdate) {
    const comp = this.component;
    const type = _.get(comp, 'source.type', '');
    const self = this;

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
            return this._loadAtts(id, comp.source.record.attributes);
          },
          {},
          forceUpdate
        );

        break;
      case 'recordsScript':
        const recordsScriptConfig = _.get(comp, 'source.recordsScript', {});
        let records = this.evaluate(recordsScriptConfig.script, {}, 'value', true);

        if (records) {
          if (_.isArray(records)) {
            records = records.map(rec => (rec.id ? rec.id : rec));
          } else {
            records = records.id ? records.id : records;
          }
        } else {
          records = null;
        }
        const evalAsync = recs =>
          this._evalAsyncValue(
            'evaluatedRecordsScript',
            recs,
            records => {
              if (!records) {
                return {};
              }
              if (_.isArray(records)) {
                return Promise.all(records.map(id => this._loadAtts(id, recordsScriptConfig.attributes)));
              } else {
                return this._loadAtts(records, recordsScriptConfig.attributes);
              }
            },
            {},
            forceUpdate
          );

        if (records && records.then) {
          records.then(evalAsync);
        } else {
          evalAsync(records);
        }

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

            return Promise.all(ids.split(',').map(id => this._loadAtts(id, comp.source.recordsArray.attributes)));
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
              return Records.query(query, attributes);
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

            const fetchData = (url, body, method) => {
              return ecosFetch(url, {
                method,
                headers: { 'Content-type': 'application/json;charset=UTF-8' },
                body
              }).then(response => {
                return response.json();
              });
            };

            const resultMapping = response => {
              if (ajaxConfig.mapping) {
                return self.evaluate(ajaxConfig.mapping, { data: response }, 'value', true);
              } else {
                return response;
              }
            };

            if (ajaxConfig.method === 'GET') {
              let valueFromCache = ajaxGetCache[url];
              if (valueFromCache) {
                return valueFromCache.then(resultMapping);
              } else {
                let value = fetchData(url, null, 'GET');
                ajaxGetCache[url] = value;
                if (Object.keys(ajaxGetCache).length > 100) {
                  //avoid memory leak
                  ajaxGetCache = {};
                }
                return value.then(resultMapping);
              }
            } else {
              return fetchData(url, body, ajaxConfig.method).then(resultMapping);
            }
          },
          null,
          forceUpdate
        );

        break;

      case 'custom':
        const customConfig = _.get(comp, 'source.custom') || {};
        const syncData = this.evaluate(customConfig.syncData, {}, 'value', true);

        this._evalAsyncValue(
          'computedCustomData',
          syncData,
          data => this.evaluate(customConfig.asyncData, { data }, 'value', true),
          null,
          forceUpdate
        );

        break;
      default:
        console.error('Unknown source type: ' + type);
    }
  }

  _evalAsyncValue(dataField, data, action, defaultValue, forceUpdate) {
    if (data === null) {
      return;
    }

    const comp = this.component;
    const currentValue = this[dataField];
    const { ignoreValuesEqualityChecking } = comp;

    if (ignoreValuesEqualityChecking || forceUpdate || !_.isEqual(currentValue, data)) {
      this[dataField] = data;

      const setValue = value => _.isEqual(data, this[dataField]) && this.setValue(value);
      const decrement = () => this.activeAsyncActionsCounter--;

      const actionImpl = () => {
        this.activeAsyncActionsCounter++;

        if (_.isEqual(data, this[dataField])) {
          try {
            const result = action.call(this, data);

            if (result) {
              if (result.then) {
                result
                  .then(setValue)
                  .catch(e => {
                    console.warn(e);
                    setValue(defaultValue);
                  })
                  .finally(decrement);
                return;
              }

              setValue(result);
            }
          } catch (e) {
            console.warn(e);
            setValue(defaultValue);
          }
        }

        decrement();
      };

      if (forceUpdate) {
        actionImpl();
      } else {
        setTimeout(actionImpl, comp.update.rate);
      }
    }
  }

  destroy() {
    const watchers = this._recordWatchers || {};

    for (let id in watchers) {
      if (watchers.hasOwnProperty(id)) {
        watchers[id].unwatch();
      }
    }
    this._recordWatchers = {};

    return super.destroy();
  }

  build(state) {
    super.build(state);

    this._recordWatchers = {};
    this.activeAsyncActionsCounter = 0;

    if (this.options.builder) {
      // We need to see it in builder mode.
      this.append(this.text(this.name + ' (' + this.key + ')'));
    } else if (this.element && this.element.classList) {
      this.element.classList.remove('form-group');
    }

    if (this.updateType === UT.EVENT) {
      this.on(
        this.component.update.event,
        () => {
          if (this.shouldExecute) {
            const isForceUpdate = _.get(this.component, 'update.force', false);
            this._updateValue(isForceUpdate);
          }
        },
        true
      );
    } else if (this.updateType === UT.ONCE && !this.updatedOnce && this.shouldExecute) {
      this.updatedOnce = true;
      this._updateValue(false);
    }

    const refreshOn = _.get(this.component, 'refreshOn', []);
    if (Array.isArray(refreshOn) && refreshOn.length > 0) {
      this.on(
        'componentChange',
        event => {
          // console.log('changed event', event)
          if (
            event &&
            event.component &&
            refreshOn.findIndex(item => item.value === event.component.key) !== -1 &&
            this.inContext(event.instance) && // Make sure the changed component is not in a different "context". Solves issues where refreshOn being set in fields inside EditGrids could alter their state from other rows (which is bad).
            this.shouldExecute // !!! это условие должно быть последним в этом "if" во избежание ненужных вызовов this.shouldExecute
          ) {
            this._updateValue(false);
          }
        },
        true
      );
    }
  }

  viewOnlyBuild() {
    this.buildHiddenElement();
  }

  createLabel() {}

  createErrorElement() {}

  setValue(value, flags) {
    const { ignoreValuesEqualityChecking } = this.component;

    if (ignoreValuesEqualityChecking || !_.isEqual(this.dataValue, value)) {
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
        component,
        data: this.data,
        event: null
      });
    }
  };
}
