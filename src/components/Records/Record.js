import isString from 'lodash/isString';
import isEmpty from 'lodash/isEmpty';
import { recordsQueryFetch, recordsMutateFetch, loadAttribute } from './recordsApi';

const ATT_NAME_REGEXP = /\.atts?\(n:"(.+?)"\).+/;

function convertAttributePath(path) {
  //A server should convert an attribute
  //maybe remove spaces for cache purposes? '  {  ' -> '{'
  return path;
}

function extractFirstAttName(path) {
  if (path[0] === '.') {
    let nameMatch = path.match(ATT_NAME_REGEXP) || [];
    return nameMatch[1] || path;
  } else {
    let name = path;

    let dotIdx = path.indexOf('.');
    if (dotIdx >= 0) {
      name = name.substring(0, dotIdx);
    }
    let qIdx = path.indexOf('?');
    if (qIdx >= 0) {
      name = name.substring(0, qIdx);
    }

    return name;
  }
}

export default class Record {
  constructor(id, baseRecord, records) {
    this._id = id;
    this._attributes = {};
    this._records = records;
    if (baseRecord) {
      this._baseRecord = baseRecord;
      this.att('_alias', id);
    } else {
      this._baseRecord = null;
    }
  }

  isBaseRecord() {
    return !this._baseRecord;
  }

  getBaseRecord() {
    return this._baseRecord || this;
  }

  get id() {
    return this._id;
  }

  toJson() {
    let attributes = {};

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
    let self = this;

    let toLoad = [];
    let toLoadNames = {};
    let loaded = {};

    let isSingleAttribute = isString(attributes);
    let attributesArr = isSingleAttribute ? [attributes] : attributes;

    for (let att of attributesArr) {
      //extract first att
      let attribute = this._attributes[att];
      if (!attribute) {
        //attribute = new Attribute(this.id, att);
        //this._attributes[att] =
      }
    }

    /*let attributesObj = attributes;

    if (isSingleAttribute) {
      attributesObj = { a: attributes };
    } else if (Array.isArray(attributes)) {
      attributesObj = {};
      for (let v of attributes) {
        attributesObj[v] = v;
      }
    }*/

    for (let att in attributesObj) {
      if (!attributesObj.hasOwnProperty(att)) {
        continue;
      }

      let requestedAtt = attributesObj[att];
      let attPath = convertAttributePath(requestedAtt);

      if (!force) {
        let existingValue = self._attributes[attPath];
        let wasLoaded = false;
        let loadedValue = null;
        if (existingValue) {
          loadedValue = existingValue.value;
          wasLoaded = true;
        }
        if (loadedValue === null && requestedAtt[0] !== '.' && requestedAtt[0] !== '#') {
          let changedValue = this._changedSimpleValues[extractFirstAttName(requestedAtt)];
          if (changedValue) {
            loadedValue = changedValue;
            wasLoaded = true;
          }
        }
        if (!wasLoaded) {
          toLoad.push(attPath);
          toLoadNames[attPath] = att;
        } else {
          loaded[att] = loadedValue;
        }
      } else {
        toLoad.push(attPath);
        toLoadNames[attPath] = att;
      }
    }

    let formatResult = result => {
      if (isSingleAttribute) {
        return result.a;
      } else {
        return result;
      }
    };

    if (toLoad.length === 0) {
      return Promise.resolve(formatResult(loaded));
    }

    let result;
    if (this._baseRecord) {
      result = this._baseRecord.load(toLoad, force);
    } else {
      result = recordsQueryFetch({
        [isArrayOfIds ? 'records' : 'record']: self.id,
        attributes: toLoad
      }).then(resp => (isArrayOfIds ? resp.records || [] : resp.attributes || {}));
    }

    return result.then(atts => {
      const getResult = atts => {
        for (let att in atts) {
          if (!atts.hasOwnProperty(att)) {
            continue;
          }
          loaded[toLoadNames[att]] = atts[att];
          self._attributes[att] = new Attribute(self, att, atts[att]);
        }
        return formatResult(loaded);
      };

      return Array.isArray(atts) ? atts.map(a => getResult(a.attributes || {})) : getResult(atts);
    });
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
  }

  getRawAttributes() {
    let attributes = {};

    for (let attName in this._attributes) {
      if (!this._attributes.hasOwnProperty(attName)) {
        continue;
      }

      let attribute = this._attributes[attName];
      if (attName.startsWith('.att') && attName.indexOf('"') !== 1) {
        attName = attName.split('"')[1];
        attributes[attName] = attribute.value;
      }
    }

    return attributes;
  }

  getAttributesToPersist() {
    let attributesToPersist = {};

    for (let attName in this._attributes) {
      if (!this._attributes.hasOwnProperty(attName)) {
        continue;
      }

      let attribute = this._attributes[attName];

      if (!attribute.isPersisted()) {
        attributesToPersist[attName] = attribute.value;
      }
    }

    return attributesToPersist;
  }

  getAssocAttributes() {
    let attributes = [];
    for (let attName in this._attributes) {
      if (!this._attributes.hasOwnProperty(attName)) {
        continue;
      }
      if (attName.startsWith('.att') && attName.endsWith('{assoc}')) {
        attributes.push(attName);
      }
    }
    return attributes;
  }

  _getLinkedRecordsToSave() {
    let self = this;

    let result = this.getAssocAttributes().reduce((acc, att) => {
      let value = self.att(att);
      value = Array.isArray(value) ? value : [value];
      return acc.concat(value.map(id => this._records.get(id)).filter(r => !r.isPersisted()));
    }, []);

    return result.map(r => r._getLinkedRecordsToSave()).reduce((acc, recs) => acc.concat(recs), result);
  }

  save() {
    let self = this;

    let recordsToSave = [this, ...this._getLinkedRecordsToSave()];
    let requestRecords = [];

    for (let record of recordsToSave) {
      let attributesToPersist = record.getAttributesToPersist();
      if (!isEmpty(attributesToPersist)) {
        let baseId = record.getBaseRecord().id;

        requestRecords.push({
          id: baseId,
          attributes: attributesToPersist
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

      for (let recordId in attributesToLoad) {
        if (attributesToLoad.hasOwnProperty(recordId)) {
          this._records.get(recordId).load(attributesToLoad[recordId], true);
        }
      }

      let resultId = ((response.records || [])[0] || {}).id;
      return resultId ? this._records.get(resultId) : self;
    });
  }

  persistedAtt(name, value) {
    if (!name) {
      return;
    }

    let localName = convertAttributePath(name);

    if (arguments.length > 1) {
      this._setAttributePersistedValueImpl(localName, value);
    } else {
      return (this._attributes[localName] || {}).persisted;
    }
  }

  att(name, value) {
    if (!name) {
      return;
    }

    let localName = convertAttributePath(name);

    if (arguments.length > 1) {
      this._setAttributeValueImpl(localName, value);
    } else {
      let attribute = this._attributes[localName];
      if (!attribute && localName.indexOf('.') !== 0 && localName.indexOf('?') === -1) {
        attribute = this._attributes[localName + '?disp'];
        if (!attribute) {
          attribute = this._attributes[localName + '?str'];
        }
        if (!attribute) {
          attribute = this._attributes['.att(n:"' + localName + '"){str}'];
        }
        if (!attribute) {
          attribute = this._attributes['.att(n:"' + localName + '"){disp}'];
        }
      }
      return (attribute || {}).value;
    }
  }

  _setAttributePersistedValueImpl(name, value) {
    let attribute = this._attributes[name];
    if (!attribute) {
      attribute = new Attribute(this, name, value);
      this._attributes[name] = attribute;
    } else {
      attribute.persisted = value;
    }
  }

  _setAttributeValueImpl(name, value) {
    let attribute = this._attributes[name];
    if (!attribute) {
      attribute = new Attribute(this, name, null);
      this._attributes[name] = attribute;
    }
    attribute.value = value;

    this._changedSimpleValues[extractFirstAttName(name)] = value;
  }
}
