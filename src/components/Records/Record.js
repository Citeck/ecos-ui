import _ from 'lodash';
import { recordsMutateFetch, loadAttribute } from './recordsApi';
import Attribute from './Attribute';
import { EventEmitter2 } from 'eventemitter2';
import { mapValueToInnerAtt } from './recordUtils';

export const EVENT_CHANGE = 'change';

const ATT_NAME_REGEXP = /\.atts?\(n:"(.+?)"\)\s*{(.+)}/;
const SIMPLE_ATT_NAME_REGEXP = /(.+?){(.+)}/;

const parseAttribute = (path, innerDefault = 'disp') => {
  if (path[0] === '#') {
    return null;
  }

  if (path[0] === '.') {
    let attMatch = path.match(ATT_NAME_REGEXP);
    if (!attMatch) {
      return null;
    }
    return {
      name: attMatch[1],
      inner:
        '.' +
        attMatch[2]
          .split(',')
          .map(s => s.trim())
          .join(','),
      isMultiple: path.indexOf('.atts') === 0
    };
  } else {
    let name = path;
    let inner;

    let dotIdx = path.indexOf('.');
    let braceIdx = path.indexOf('{');

    if (dotIdx > 0 && (braceIdx === -1 || dotIdx < braceIdx - 1)) {
      inner = name.substring(dotIdx + 1);
      let qIdx = inner.indexOf('?');
      if (qIdx === -1 && braceIdx === -1) {
        inner += '?disp';
      }
      name = name.substring(0, dotIdx);
    } else {
      let match = name.match(SIMPLE_ATT_NAME_REGEXP);

      if (match == null) {
        let qIdx = path.indexOf('?');
        if (qIdx >= 0) {
          inner = name.substring(qIdx + 1);
          name = name.substring(0, qIdx);
        } else {
          inner = innerDefault;
        }
      } else {
        name = match[1];
        inner = match[2]
          .split(',')
          .map(s => s.trim())
          .join(',');
      }
    }

    let isMultiple = false;
    if (name.indexOf('[]') === name.length - 2) {
      name = name.substring(0, name.length - 2);
      isMultiple = true;
    }

    return {
      name,
      inner,
      isMultiple
    };
  }
};

export default class Record {
  constructor(id, records, baseRecord) {
    this._id = id;
    this._attributes = {};
    this._recordFields = {};
    this._records = records;
    if (baseRecord) {
      this._baseRecord = baseRecord;
      this.att('_alias', id);
    } else {
      this._baseRecord = null;
    }
    this._emitter = new EventEmitter2();
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

  getBaseRecord() {
    return this._baseRecord || this;
  }

  toJson() {
    let attributes = {};

    if (this._baseRecord) {
      let baseAtts = this._baseRecord._attributes;
      for (let att in baseAtts) {
        if (baseAtts.hasOwnProperty(att)) {
          attributes[att] = baseAtts[att].getValue();
        }
      }
    }

    for (let att in this._attributes) {
      if (this._attributes.hasOwnProperty(att)) {
        attributes[att] = this._attributes[att].getValue();
      }
    }

    return { id: this.id, attributes };
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

  load(attributes, force) {
    let attsMapping = {};
    let attsToLoad = [];

    let isSingleAttribute = _.isString(attributes);
    if (isSingleAttribute) {
      attsToLoad = [attributes];
    } else if (_.isArray(attributes)) {
      attsToLoad = attributes;
    } else if (_.isObject(attributes)) {
      for (let attAlias in attributes) {
        if (attributes.hasOwnProperty(attAlias)) {
          let attToLoad = attributes[attAlias];
          attsMapping[attributes[attAlias]] = attAlias;
          attsToLoad.push(attToLoad);
        }
      }
    } else {
      attsToLoad = attributes;
    }

    return Promise.all(
      attsToLoad.map(att => {
        let parsedAtt = parseAttribute(att);
        if (parsedAtt === null) {
          let value = this._recordFields[att];
          if (!force && value !== undefined) {
            return value;
          } else {
            value = this._loadRecordAttImpl(att);
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
        } else {
          let attribute = this._attributes[parsedAtt.name];
          if (!attribute) {
            attribute = new Attribute(this, parsedAtt.name);
            this._attributes[parsedAtt.name] = attribute;
          }
          return attribute.getValue(parsedAtt.inner, parsedAtt.isMultiple, true, force);
        }
      })
    ).then(loadedAtts => {
      let result = {};

      for (let i = 0; i < attsToLoad.length; i++) {
        let attKey = attsToLoad[i];
        attKey = attsMapping[attKey] || attKey;
        result[attsMapping[attKey] || attKey] = loadedAtts[i];
      }

      return isSingleAttribute ? result[Object.keys(result)[0]] : result;
    });
  }

  _loadRecordAttImpl(attribute) {
    if (this._baseRecord) {
      return this._baseRecord.load(attribute);
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
    this._attributes = {};
    this._recordFields = {};
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
    let attributesToPersist = {};

    for (let attName in this._attributes) {
      if (!this._attributes.hasOwnProperty(attName)) {
        continue;
      }

      let attribute = this._attributes[attName];

      if (!attribute.isPersisted()) {
        attributesToPersist[attribute.getNewValueAttName()] = attribute.getValue();
      }
    }

    return attributesToPersist;
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

  _getLinkedRecordsToSave() {
    let self = this;

    let result = this._getAssocAttributes().reduce((acc, att) => {
      let value = self.att(att);
      value = Array.isArray(value) ? value : [value];
      return acc.concat(value.map(id => this._records.get(id)).map(rec => rec._getWhenReadyToSave()));
    }, []);

    return Promise.all(result).then(records => records.filter(r => !r.isPersisted()));
  }

  save() {
    let self = this;

    let recordsToSavePromises = [this._getWhenReadyToSave(), this._getLinkedRecordsToSave()];
    let requestRecords = [];

    return Promise.all(recordsToSavePromises).then(([baseRecordToSave, linkedRecordsToSave]) => {
      const recordsToSave = [baseRecordToSave, ...linkedRecordsToSave];
      for (let record of recordsToSave) {
        let attributesToSave = record.getAttributesToSave();
        if (!_.isEmpty(attributesToSave)) {
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
            this._records.get(recordId).events.emit(EVENT_CHANGE);
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
      Attribute.prototype.setPersistedValue
    );
  }

  att(name, value) {
    return this._processAttField(name, value, arguments.length === 1, Attribute.prototype.getValue, Attribute.prototype.setValue);
  }

  _processAttField(name, value, isRead, getter, setter) {
    if (!name) {
      return null;
    }

    let parsedAtt = parseAttribute(name, mapValueToInnerAtt(value));
    if (parsedAtt === null) {
      return null;
    }

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
      let innerAtt = parsedAtt.inner;
      if (value === undefined && name.indexOf('?') === -1 && name[0] !== '.') {
        innerAtt = null;
      }
      return getter.call(att, innerAtt, parsedAtt.isMultiple, false);
    } else {
      return setter.call(att, parsedAtt.inner, value);
    }
  }
}
