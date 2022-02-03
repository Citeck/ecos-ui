import _ from 'lodash';
import { EventEmitter2 } from 'eventemitter2';

import { mapValueToScalar, parseAttribute } from './utils/attStrUtils';
import { loadAttribute, recordsMutateFetch } from './recordsApi';
import Attribute from './Attribute';
import RecordWatcher from './RecordWatcher';

import recordsClientManager from './client';
import { prepareAttsToLoad } from './utils/recordUtils';

export const EVENT_CHANGE = 'change';

export default class Record {
  constructor(id, records, baseRecord) {
    this._id = id;
    this._attributes = {};
    this._recordFields = {};
    this._recordFieldsToSave = {};
    this._records = records;
    if (baseRecord) {
      this._baseRecord = baseRecord;
      this.att('_alias', id);
    } else {
      this._baseRecord = null;
    }
    this._emitter = new EventEmitter2();
    this._modified = null;
    this._pendingUpdate = false;
    this._updatePromise = Promise.resolve();
    this._watchers = [];
    this._owners = {};
    this._virtual = false;
  }

  get id() {
    return this._id;
  }

  get events() {
    return this._emitter;
  }

  isBaseRecord() {
    return !this._baseRecord;
  }

  isPendingUpdate() {
    return this._pendingUpdate;
  }

  getUpdatePromise() {
    return this._updatePromise;
  }

  getBaseRecord() {
    return this._baseRecord || this;
  }

  toJson(withDisplayNames) {
    let attributes = {};

    if (this._baseRecord) {
      let baseAtts = this._baseRecord._attributes;
      for (let att in baseAtts) {
        if (baseAtts.hasOwnProperty(att)) {
          attributes[att] = baseAtts[att].getValue();
        }
      }
    }

    const isPersistedAssocValue = value => {
      return value && typeof value === 'string' && value.includes('workspace://') && !value.includes('alias');
    };

    let recId = this.id;
    for (let att in this._attributes) {
      if (this._attributes.hasOwnProperty(att)) {
        if (att === '_att_id') {
          recId = this._attributes[att].getValue();
        } else {
          const value = this._attributes[att].getValue();
          if (value && withDisplayNames) {
            if (Array.isArray(value)) {
              let hasPromises = false;
              let mappedValues = value.map(it => {
                if (isPersistedAssocValue(it)) {
                  hasPromises = true;
                  return this._records.get(it).load('.disp');
                }
                return it;
              });
              attributes[att] = hasPromises ? Promise.all(mappedValues) : mappedValues;
            } else {
              if (isPersistedAssocValue(value)) {
                attributes[att] = this._records.get(value).load('.disp');
              } else {
                attributes[att] = value;
              }
            }
          } else {
            attributes[att] = value;
          }
        }
      }
    }

    for (let complexAtt in this._recordFieldsToSave) {
      if (!this._recordFieldsToSave.hasOwnProperty(complexAtt)) {
        continue;
      }

      const att = complexAtt.substring(complexAtt.indexOf('(n:"') + 4, complexAtt.indexOf('")'));

      if (att && !attributes[att]) {
        attributes[att] = this._recordFieldsToSave[complexAtt];
      }
    }

    return { id: recId, attributes };
  }

  async toJsonAsync(withDisplayNames) {
    await this._getWhenReadyToSave();

    const json = this.toJson(withDisplayNames);

    const keys = Object.keys(json.attributes);
    const promises = [];
    for (let key of keys) {
      const att = json.attributes[key];
      if (att && att.then) {
        const promise = att.then(res => (json.attributes[key] = res)).catch(() => (json.attributes[key] = null));
        promises.push(promise);
      }
    }

    if (promises.length === 0) {
      return json;
    } else {
      return Promise.all(promises)
        .then(() => json)
        .catch(() => json);
    }
  }

  isPersisted() {
    const atts = this._attributes;

    for (let att in atts) {
      if (!atts.hasOwnProperty(att)) {
        continue;
      }
      if (att !== '_alias' && !atts[att].isPersisted()) {
        return false;
      }
    }
    return true;
  }

  _innerUpdate(resolve, reject) {
    if (this.isVirtual()) {
      resolve();
      return Promise.resolve();
    }
    return this.load(
      {
        modified: '_modified?str',
        pendingUpdate: 'pendingUpdate?bool'
      },
      true
    ).then(({ modified, pendingUpdate }) => {
      if (pendingUpdate === true) {
        setTimeout(() => {
          this._innerUpdate(resolve, reject);
        }, 2000);
      } else {
        if (this._modified !== modified || this._checkWatchersToLoad()) {
          this._modified = modified;

          Promise.all(
            this._watchers.map(watcher => {
              return this.load(watcher.getWatchedAttributes(), true)
                .then(loadedAtts => {
                  return {
                    watcher,
                    loadedAtts
                  };
                })
                .catch(e => {
                  console.error(e);
                  return {
                    watcher,
                    loadedAtts: watcher.getAttributes()
                  };
                });
            })
          ).then(watchersData => {
            for (let data of watchersData) {
              try {
                data.watcher.setAttributes(data.loadedAtts);
              } catch (e) {
                console.error(e);
              }
            }
            resolve();
          });
        } else {
          resolve();
        }
      }
    });
  }

  /**
   * Проверка атрибутов на необходимость загрузки данных
   *
   * Условия:
   * - содержится точка в названии атрибута
   * - содержится префикс assoc_src_
   * @returns {boolean}
   * @private
   */
  _checkWatchersToLoad() {
    if (!this._watchers.length) {
      return false;
    }

    const checkConditions = attr => attr.includes('.') || attr.includes('assoc_src_');

    return this._watchers.some(watcher => {
      const attrs = watcher.getWatchedAttributes();

      if (Array.isArray(attrs)) {
        return attrs.some(checkConditions);
      }

      if (typeof attrs == 'string') {
        return checkConditions(attrs);
      }

      return false;
    });
  }

  update() {
    if (this.isVirtual()) {
      return Promise.resolve();
    }

    this._pendingUpdate = true;

    let promise = null;
    const cleanUpdateStatus = () => {
      if (this._updatePromise === promise) {
        this._pendingUpdate = false;
      }
    };

    promise = new Promise((resolve, reject) => {
      this._innerUpdate(resolve, reject);
    })
      .then(cleanUpdateStatus)
      .catch(e => {
        console.error(e);
        cleanUpdateStatus();
      });
    this._updatePromise = promise;
    return promise;
  }

  debounceUpdate = _.debounce(() => this.update(), 400);

  unwatch(watcher) {
    for (let i = 0; i < this._watchers; i++) {
      if (this._watchers[i] === watcher) {
        this._watchers.splice(i, 1);
        break;
      }
    }
  }

  watch(attributes, callback) {
    if (this.isVirtual()) {
      return;
    }

    const watcher = new RecordWatcher(this, attributes, callback);
    const attsPromise = this.load(attributes);

    this._watchers.push(watcher);

    Promise.all([attsPromise, this.load('pendingUpdate?bool')])
      .then(([loadedAtts, pendingUpdate]) => {
        if (pendingUpdate) {
          this.debounceUpdate();
        }

        watcher.setAttributes(loadedAtts);
      })
      .catch(e => {
        console.error(e);

        attsPromise.then(atts => watcher.setAttributes(atts)).catch(console.error);
      });

    return watcher;
  }

  async load(attributes, force) {
    let attsAliases = [];
    let attsToLoad = [];

    const isSingleAttribute = _.isString(attributes);
    prepareAttsToLoad(attributes, attsToLoad, attsAliases);

    const attsToLoadLengthWithoutClient = attsToLoad.length;

    let clientData = null;

    if (!this.isVirtual() && !this.isPendingCreate()) {
      const sourceIdDelimIdx = this.id.indexOf('@');
      let clientSourceId = null;
      if (sourceIdDelimIdx !== -1) {
        clientSourceId = this.id.substring(0, sourceIdDelimIdx);
      }
      clientData = await recordsClientManager.preProcessAtts(clientSourceId, attsToLoad);
      if (clientData && clientData.clientAtts) {
        prepareAttsToLoad(clientData.clientAtts, attsToLoad, attsAliases);
      }
    }

    let loadedAtts = await Promise.all(attsToLoad.map(att => this._loadAttWithCacheImpl(att, force)));

    if (clientData) {
      const clientAtts = {};
      for (let i = attsToLoadLengthWithoutClient; i < attsToLoad.length; i++) {
        clientAtts[attsAliases[i]] = loadedAtts[i];
      }
      const mutClientData = await recordsClientManager.postProcessAtts(loadedAtts, clientAtts, clientData);
      if (mutClientData) {
        this._mutClientData = mutClientData;
      }
    }

    if (isSingleAttribute) {
      return loadedAtts[0];
    }

    let attsResultMap = {};
    for (let i = 0; i < attsToLoadLengthWithoutClient; i++) {
      attsResultMap[attsAliases[i]] = loadedAtts[i];
    }

    return attsResultMap;
  }

  async _loadAttWithCacheImpl(att, force) {
    let parsedAtt = parseAttribute(att);
    if (parsedAtt != null) {
      let attribute = this._attributes[parsedAtt.name];
      if (!attribute) {
        attribute = new Attribute(this, parsedAtt.name);
        this._attributes[parsedAtt.name] = attribute;
      }
      return attribute.getValue(parsedAtt.scalar, parsedAtt.isMultiple, true, force);
    }

    let value = this._recordFieldsToSave[att];
    if (value === undefined) {
      value = this._recordFields[att];
    }
    if (!force && value !== undefined) {
      return value;
    } else {
      value = this._loadRecordAttImpl(att, force);
      if (value && value.then) {
        this._recordFields[att] = value
          .then(loaded => {
            this._recordFields[att] = loaded;
            return loaded;
          })
          .catch(e => {
            console.error(e);
            this._recordFields[att] = null;
            return null;
          });
      } else {
        this._recordFields[att] = value;
      }
      return this._recordFields[att];
    }
  }

  _loadRecordAttImpl(attribute, force) {
    if (this._baseRecord) {
      return this._baseRecord._loadAttWithCacheImpl(attribute, force);
    } else {
      return loadAttribute(this.id, attribute);
    }
  }

  loadAttribute(attribute) {
    return this.load(attribute);
  }

  loadEditorKey(attribute) {
    if (!attribute) {
      return Promise.resolve(null);
    }
    return this.loadAttribute('#' + attribute + '?editorKey');
  }

  loadOptions(attribute) {
    if (!attribute) {
      return Promise.resolve(null);
    }
    return this.loadAttribute('#' + attribute + '?options');
  }

  reset() {
    // if we reset virtual record,
    // then data will be lost and
    // we can't reload it from server
    if (!this.isVirtual()) {
      this._attributes = {};
      this._recordFields = {};
      this._recordFieldsToSave = {};
    }
  }

  getRawAttributes() {
    let attributes = {};

    for (let attName in this._attributes) {
      if (!this._attributes.hasOwnProperty(attName)) {
        continue;
      }
      let attribute = this._attributes[attName];
      attributes[attName] = attribute.getValue();
    }

    return attributes;
  }

  getAttributesToSave() {
    let attributesToSave = {};

    for (let att in this._recordFieldsToSave) {
      if (this._recordFieldsToSave.hasOwnProperty(att)) {
        attributesToSave[att] = this._recordFieldsToSave[att];
      }
    }

    for (let attName in this._attributes) {
      if (!this._attributes.hasOwnProperty(attName)) {
        continue;
      }

      let attribute = this._attributes[attName];

      if (!attribute.isPersisted()) {
        attributesToSave[attribute.getNewValueAttName()] = attribute.getValue();
      }
    }

    return attributesToSave;
  }

  _getAssocAttributes() {
    let attributes = [];
    for (let attName in this._attributes) {
      if (!this._attributes.hasOwnProperty(attName)) {
        continue;
      }
      let attribute = this._attributes[attName];
      if (attribute.getNewValueInnerAtt() === 'assoc') {
        attributes.push(attName);
      }
    }
    return attributes;
  }

  async _getLinkedRecordsToSave() {
    let self = this;

    let result = this._getAssocAttributes().reduce((acc, att) => {
      let value = self.att(att);
      if (!value) {
        return acc;
      }
      value = Array.isArray(value) ? value : [value];
      return acc.concat(value.map(id => this._records.get(id)).map(rec => rec._getWhenReadyToSave()));
    }, []);

    const linkedRecords = await Promise.all(result).then(records => records.filter(r => !r.isPersisted()));
    const nestedLinkedRecords = await Promise.all(linkedRecords.map(async r => await r._getLinkedRecordsToSave()));
    const nestedLinkedRecordsFlatten = nestedLinkedRecords.reduce((acc, val) => acc.concat(val), []);
    return [...linkedRecords, ...nestedLinkedRecordsFlatten];
  }

  save() {
    if (this.isVirtual()) {
      return;
    }
    let self = this;

    let requestRecords = [];

    let recordsToSavePromises = this._getWhenReadyToSave().then(baseRecordToSave => {
      return this._getLinkedRecordsToSave().then(linkedRecords => [baseRecordToSave, ...linkedRecords]);
    });

    return recordsToSavePromises.then(async recordsToSave => {
      for (let record of recordsToSave) {
        let attributesToSave = record.getAttributesToSave();
        if (!_.isEmpty(attributesToSave)) {
          if (record._mutClientData) {
            await recordsClientManager.prepareMutation(attributesToSave, record._mutClientData);
          }
          let baseId = record.getBaseRecord().id;
          requestRecords.push({
            id: baseId,
            attributes: attributesToSave
          });
        }
      }

      if (!requestRecords.length) {
        return Promise.resolve(this);
      }

      return recordsMutateFetch({ records: requestRecords }).then(response => {
        let attributesToLoad = {};

        for (let record of requestRecords) {
          let recAtts = attributesToLoad[record.id] || {};

          for (let att in record.attributes) {
            if (record.attributes.hasOwnProperty(att)) {
              recAtts[att] = att;
            }
          }

          attributesToLoad[record.id] = recAtts;
        }

        let loadPromises = [];
        for (let recordId in attributesToLoad) {
          if (attributesToLoad.hasOwnProperty(recordId)) {
            let record = this._records.get(recordId);
            record.reset();
            let promise = record.load(attributesToLoad[recordId], true);
            if (promise && promise.then) {
              loadPromises.push(promise);
            }
          }
        }

        return Promise.all(loadPromises).then(() => {
          for (let recordId of Object.keys(attributesToLoad)) {
            let record = this._records.get(recordId);
            record.events.emit(EVENT_CHANGE);
            record.update();
          }
          let resultId = ((response.records || [])[0] || {}).id;
          return resultId ? this._records.get(resultId) : self;
        });
      });
    });
  }

  _getWhenReadyToSave() {
    return new Promise((resolve, reject) => {
      const resolveWithNode = () => resolve(this);
      this._waitUntilReadyToSave(0, resolveWithNode, reject);
    });
  }

  _waitUntilReadyToSave(tryCounter, resolve, reject) {
    let notReadyAtts = [];
    for (let attName in this._attributes) {
      if (!this._attributes.hasOwnProperty(attName)) {
        continue;
      }
      let att = this._attributes[attName];
      if (!att.isReadyToSave()) {
        notReadyAtts.push(attName);
      }
    }
    for (let attName in this._recordFieldsToSave) {
      if (!this._recordFieldsToSave.hasOwnProperty(attName)) {
        continue;
      }
      let value = this._recordFieldsToSave[attName];
      if (value && value.then) {
        notReadyAtts.push(attName);
      }
    }

    if (notReadyAtts.length > 0) {
      if (tryCounter > 100) {
        console.error('Not ready attributes:', notReadyAtts);
        reject('Record _waitUntilReadyToSave aborted');
      } else {
        setTimeout(() => this._waitUntilReadyToSave(tryCounter + 1, resolve, reject), 100);
      }
    } else {
      resolve();
    }
  }

  persistedAtt(name, value) {
    return this._processAttField(
      name,
      value,
      arguments.length === 1,
      Attribute.prototype.getPersistedValue,
      Attribute.prototype.setPersistedValue,
      false
    );
  }

  att(name, value) {
    return this._processAttField(name, value, arguments.length === 1, Attribute.prototype.getValue, Attribute.prototype.setValue, true);
  }

  removeAtt(name) {
    let parsedAtt = parseAttribute(name);
    let key = (parsedAtt ? parsedAtt.name : null) || name;
    delete this._attributes[key];
  }

  isVirtual() {
    if (this._virtual) {
      return true;
    }
    let baseRecord = this.getBaseRecord();
    return baseRecord.id !== this.id && baseRecord.isVirtual();
  }

  isPendingCreate() {
    let baseRecordId = this.getBaseRecord().id;
    // base record with '@' at the end mean that record is not exists yet and will be created on save
    return baseRecordId.indexOf('@') === baseRecordId.length - 1;
  }

  _processAttField(name, value, isRead, getter, setter, toSave) {
    if (!name) {
      return null;
    }

    let parsedAtt = parseAttribute(name, mapValueToScalar(value));
    if (parsedAtt === null) {
      if (isRead) {
        let attValue = this._recordFieldsToSave[name];
        if (attValue === undefined) {
          attValue = this._recordFields[name];
        }
        if (attValue !== undefined) {
          return attValue;
        }
      } else {
        if (toSave) {
          let currentValue = this._recordFields[name];
          if (currentValue === undefined) {
            this._recordFieldsToSave[name] = this.load(name, true)
              .then(loadedValue => {
                if (!_.isEqual(loadedValue, value)) {
                  this._recordFieldsToSave[name] = value;
                  return value;
                } else {
                  delete this._recordFieldsToSave[name];
                  return null;
                }
              })
              .catch(e => {
                console.error(e);
                delete this._recordFieldsToSave[name];
                return null;
              });
          } else if (!_.isEqual(currentValue, value)) {
            this._recordFieldsToSave[name] = value;
          }
        } else {
          this._recordFields[name] = value;
        }
      }
      return null;
    } else {
      let att = this._attributes[parsedAtt.name];
      if (!att) {
        if (isRead) {
          if (this._baseRecord) {
            att = this._baseRecord._attributes[parsedAtt.name];
          }
          if (!att) {
            return parsedAtt.isMultiple ? [] : null;
          }
        } else {
          att = new Attribute(this, parsedAtt.name);
          this._attributes[parsedAtt.name] = att;
        }
      }

      if (isRead) {
        let scalar = parsedAtt.scalar;
        if (value === undefined && name.indexOf('?') === -1 && name[0] !== '.') {
          scalar = null;
        }
        return getter.call(att, scalar, parsedAtt.isMultiple, false);
      } else {
        if (att) {
          return setter.call(att, parsedAtt.scalar, value);
        } else {
          console.warn("Attribute can't be changed: '" + name + "'");
        }
      }
    }
  }

  forceUpdate() {
    this._watchers.forEach(watcher => {
      watcher.callCallback();
    });
  }
}
