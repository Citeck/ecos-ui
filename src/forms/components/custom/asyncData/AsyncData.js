import Records from '@citeck/records-core';
import Formio from 'formiojs/Formio';
import cloneDeep from 'lodash/cloneDeep';
import debounce from 'lodash/debounce';
import get from 'lodash/get';
import isArray from 'lodash/isArray';
import isEqual from 'lodash/isEqual';
import isNil from 'lodash/isNil';
import isString from 'lodash/isString';
import omitBy from 'lodash/omitBy';

import ecosFetch from '../../../../helpers/ecosFetch';
import BaseComponent from '../base/BaseComponent';

import { SourceTypes, UpdateTypes } from './const';

let ajaxGetCache = {};

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
        },
        persistent: 'client-only'
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
      source: omitBy(comp.source, (value, key) => {
        if (['type', 'forceLoad'].includes(key)) {
          return false;
        }
        return key !== comp.source.type;
      }),
      update: omitBy(comp.update, (value, key) => isEqual(defaultSchema.update[key], value))
    };
  }

  updatedOnce = false;
  _onceUpdatePending = false;
  _asyncRequestSeq = 0;
  _recordsScriptSeq = 0;

  get defaultSchema() {
    return AsyncDataComponent.schema();
  }

  get visible() {
    return false;
  }

  get shouldExecute() {
    const executionCondition = get(this.component, 'executionCondition');

    if (executionCondition) {
      return this.evaluate(executionCondition, {}, 'value', true);
    }

    return true;
  }

  get emptyValue() {
    return {};
  }

  get updateType() {
    return get(this.component, 'update.type', '');
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

  _unwatchRecords() {
    const watchers = this._recordWatchers || {};

    for (let id in watchers) {
      if (watchers.hasOwnProperty(id)) {
        watchers[id].unwatch();
      }
    }
    this._recordWatchers = {};
  }

  _resetSkippedState() {
    if (this._updateValue && typeof this._updateValue.cancel === 'function') {
      this._updateValue.cancel();
    }

    this._onceUpdatePending = false;
    this._asyncRequestSeq = (this._asyncRequestSeq || 0) + 1;
    this._recordsScriptSeq = (this._recordsScriptSeq || 0) + 1;
    this._unwatchRecords();

    delete this.evaluatedRecordId;
    delete this.evaluatedRecordIds;
    delete this.evaluatedRecordsScript;
    delete this.evaluatedRecordsQuery;
    delete this.computedAjaxData;
    delete this.computedCustomData;

    if (!isEqual(this.dataValue, this.emptyValue)) {
      this.setValue(cloneDeep(this.emptyValue));
    }
  }

  checkConditions(data) {
    const result = super.checkConditions(data);

    if (this.shouldExecute) {
      if (this.updateType === UpdateTypes.anyChange) {
        this._updateValue(false);
      }
      if (this.updateType === UpdateTypes.once && !this.updatedOnce && !this._onceUpdatePending) {
        this._onceUpdatePending = true;
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
    const watcherKey = baseRecord.id;
    const callback = () => {
      if (this.shouldExecute) {
        this._updateValue(true);
      }
    };

    let attributesMap;
    if (isArray(attributes)) {
      attributesMap = {};
      for (let att of attributes) {
        attributesMap[att] = att;
      }
    } else {
      attributesMap = attributes;
    }

    let watcher = this._recordWatchers[watcherKey];
    if (!watcher) {
      watcher = baseRecord.watch(attributesMap, callback);
      if (watcher) {
        this._recordWatchers[watcherKey] = watcher;
      }
    } else {
      let watchedAtts = watcher.getWatchedAttributes();
      let isAllRequiredAttsWatched = true;
      for (let attName in attributesMap) {
        if (attributesMap.hasOwnProperty(attName) && !watchedAtts[attName]) {
          watchedAtts[attName] = attributesMap[attName];
          isAllRequiredAttsWatched = false;
        }
      }
      if (!isAllRequiredAttsWatched) {
        watcher.unwatch();
        watcher = baseRecord.watch(watchedAtts, callback);
        if (watcher) {
          this._recordWatchers[watcherKey] = watcher;
        }
      }
    }

    const force = get(this.component, 'source.forceLoad', false);
    return baseRecord.load(attributes, force);
  }

  _updateValue = debounce(forceUpdate => {
    this._onceUpdatePending = false;

    if (!this.shouldExecute) {
      return;
    }

    const comp = this.component;
    const type = get(comp, 'source.type', '');

    if (this.updateType === UpdateTypes.once && type !== SourceTypes.recordsScript) {
      this.updatedOnce = true;
    }

    switch (type) {
      case SourceTypes.record:
        let recordId = get(comp, 'source.record.id', '');
        if (recordId) {
          recordId = this.interpolate(recordId, { item: this.rootValue });
        }

        this._evalAsyncValue(
          'evaluatedRecordId',
          recordId,
          id => this._loadAtts(id, get(comp, 'source.record.attributes')),
          {},
          forceUpdate
        );

        break;
      case SourceTypes.recordsScript:
        const recordsScriptConfig = get(comp, 'source.recordsScript') || {};
        let records = this.evaluate(recordsScriptConfig.script, {}, 'value', true);

        if (records) {
          if (isArray(records)) {
            records = records.map(rec => (rec.id ? rec.id : rec));
          } else {
            records = records.id || records;
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
              if (isArray(records)) {
                return Promise.all(records.map(id => this._loadAtts(id, recordsScriptConfig.attributes)));
              }
              return this._loadAtts(records, recordsScriptConfig.attributes);
            },
            {},
            forceUpdate
          );

        const scriptSeq = ++this._recordsScriptSeq;
        if (records && records.then) {
          if (this.updateType === UpdateTypes.once) {
            this._onceUpdatePending = true;
          }
          records.then(
            recs => {
              if (scriptSeq === this._recordsScriptSeq) {
                this._onceUpdatePending = false;
                if (this.shouldExecute) {
                  if (this.updateType === UpdateTypes.once) {
                    this.updatedOnce = true;
                  }
                  evalAsync(recs);
                }
              }
            },
            e => {
              if (scriptSeq === this._recordsScriptSeq) {
                this._onceUpdatePending = false;
                if (this.shouldExecute && this.updateType === UpdateTypes.once) {
                  this.updatedOnce = true;
                }
              }
              console.warn(e);
            }
          );
        } else {
          if (this.updateType === UpdateTypes.once) {
            this.updatedOnce = true;
          }
          evalAsync(records);
        }

        break;
      case SourceTypes.recordsArray:
        let recordIds = get(comp, 'source.recordsArray.id', '');
        if (recordIds) {
          recordIds = this.interpolate(recordIds, { item: this.rootValue });
        }

        this._evalAsyncValue(
          'evaluatedRecordIds',
          recordIds,
          ids => (ids ? Promise.all(ids.split(',').map(id => this._loadAtts(id, comp.source.recordsArray.attributes))) : []),
          {},
          forceUpdate
        );

        break;
      case SourceTypes.recordsQuery:
        const recQueryConfig = get(comp, 'source.recordsQuery', {});
        let query = this.evaluate(recQueryConfig.query, {}, 'value', true);

        this._evalAsyncValue(
          'evaluatedRecordsQuery',
          query,
          query => {
            const attributes = recQueryConfig.attributes || {};
            if (recQueryConfig.isSingle) {
              return Records.queryOne(query, attributes);
            }
            return Records.query(query, attributes);
          },
          {},
          forceUpdate
        );

        break;
      case SourceTypes.ajax:
        const ajaxConfig = get(comp, 'source.ajax') || {};
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

            const fetchData = (url, body, method) =>
              ecosFetch(url, { method, body, headers: { 'Content-type': 'application/json;charset=UTF-8' } }).then(response =>
                response.json()
              );

            const resultMapping = data => (ajaxConfig.mapping ? this.evaluate(ajaxConfig.mapping, { data }, 'value', true) : data);

            if (ajaxConfig.method === 'GET') {
              const valueFromCache = ajaxGetCache[url];

              if (valueFromCache) {
                return valueFromCache.then(resultMapping);
              }

              const value = fetchData(url, null, 'GET');
              ajaxGetCache[url] = value;
              if (Object.keys(ajaxGetCache).length > 100) {
                //avoid memory leak
                ajaxGetCache = {};
              }
              return value.then(resultMapping);
            }

            return fetchData(url, body, ajaxConfig.method).then(resultMapping);
          },
          null,
          forceUpdate
        );

        break;

      case SourceTypes.custom:
        const customConfig = get(comp, 'source.custom') || {};
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
  }, 200);

  #isValidData = data => {
    const type = get(this.component, 'source.type', '');

    if (type === SourceTypes.recordsScript) {
      return isString(data) || isArray(data);
    }

    return data !== null;
  };

  _evalAsyncValue(dataField, data, action, defaultValue, forceUpdate) {
    if (!this.#isValidData(data)) {
      return;
    }

    const comp = this.component;
    const currentValue = this[dataField];
    const { ignoreValuesEqualityChecking } = comp;

    if (ignoreValuesEqualityChecking || forceUpdate || !isEqual(currentValue, data)) {
      const requestSeq = ++this._asyncRequestSeq;
      this[dataField] = data;

      const setValue = value => requestSeq === this._asyncRequestSeq && isEqual(data, this[dataField]) && this.setValue(value);

      const decrement = () => this.activeAsyncActionsCounter--;

      const actionImpl = () => {
        this.activeAsyncActionsCounter++;

        if (requestSeq === this._asyncRequestSeq && isEqual(data, this[dataField])) {
          try {
            const result = action.call(this, data);

            if (!isNil(result)) {
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
    if (this._updateValue && typeof this._updateValue.cancel === 'function') {
      this._updateValue.cancel();
    }
    this._onceUpdatePending = false;
    this._asyncRequestSeq = (this._asyncRequestSeq || 0) + 1;
    this._recordsScriptSeq = (this._recordsScriptSeq || 0) + 1;
    this._unwatchRecords();

    return super.destroy();
  }

  build(state) {
    super.build(state);

    this._onceUpdatePending = false;
    this._recordWatchers = {};
    this.activeAsyncActionsCounter = 0;

    if (this.options.builder) {
      // We need to see it in builder mode.
      this.append(this.text(this.name + ' (' + this.key + ')'));
    } else if (this.element && this.element.classList) {
      this.element.classList.remove('form-group');
    }

    if (this.updateType === UpdateTypes.event) {
      this.on(
        this.component.update.event,
        () => {
          if (this.shouldExecute) {
            const isForceUpdate = get(this.component, 'update.force', false);
            this._updateValue(isForceUpdate);
          }
        },
        true
      );
    } else if (this.updateType === UpdateTypes.once && !this.updatedOnce && !this._onceUpdatePending && this.shouldExecute) {
      this._onceUpdatePending = true;
      this._updateValue(false);
    }

    const refreshOn = get(this.component, 'refreshOn', []);
    if (isArray(refreshOn) && refreshOn.length > 0) {
      this.on(
        'componentChange',
        event => {
          //console.log(event.instance.component.key, 'changed event', event)
          if (
            event &&
            event.component &&
            refreshOn.findIndex(item => item.value === event.component.key) !== -1 &&
            this.inContext(event.instance) // Make sure the changed component is not in a different "context". Solves issues where refreshOn being set in fields inside EditGrids could alter their state from other rows (which is bad).
          ) {
            if (this.shouldExecute) {
              this._updateValue(false);
            } else {
              this._resetSkippedState();
            }
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

    const submitActionDone = get(this.root, 'submitActionDone');

    const isValid = this.checkValidity(this.data);
    if (submitActionDone && isValid) {
      return;
    }

    if (ignoreValuesEqualityChecking || !isEqual(this.dataValue, value)) {
      flags = this.getFlags.apply(this, arguments);

      this.dataValue = value;
      this.updateValue(flags);
      this.triggerChange(flags);
      this.triggerEventOnChange(flags);

      this.emit('change', {
        changed: {
          instance: this,
          component: this.component,
          value: this.dataValue,
          flags
        },
        data: this.data
      });

      return true;
    }

    return false;
  }

  getValue() {
    return this.dataValue;
  }

  triggerEventOnChange = () => {
    const component = this.component;
    const data = cloneDeep(this.data);

    if (component.eventName) {
      this.emit(this.interpolate(component.eventName), data);
      this.events.emit(this.interpolate(component.eventName), data);
      this.emit('customEvent', {
        type: this.interpolate(component.eventName),
        component,
        data,
        event: null
      });
    }
  };
}
