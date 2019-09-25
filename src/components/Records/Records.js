import cloneDeep from 'lodash/cloneDeep';
import isString from 'lodash/isString';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';
import lodashGet from 'lodash/get';
import isArray from 'lodash/isArray';

const QUERY_URL = '/share/proxy/alfresco/citeck/ecos/records/query';
const DELETE_URL = '/share/proxy/alfresco/citeck/ecos/records/delete';
const MUTATE_URL = '/share/proxy/alfresco/citeck/ecos/records/mutate';

const ATT_NAME_REGEXP = /\.atts?\(n:"(.+?)"\).+/;

const GATEWAY_URL_MAP = {};
GATEWAY_URL_MAP[QUERY_URL] = '/share/api/records/query';
GATEWAY_URL_MAP[MUTATE_URL] = '/share/api/records/mutate';
GATEWAY_URL_MAP[DELETE_URL] = '/share/api/records/delete';

let Records;

let tmpRecordsCounter = 0;

function isAnyWithAppName(records) {
  for (let i = 0; i < records.length; i++) {
    if (isRecordWithAppName(records[i])) {
      return true;
    }
  }
}

function isRecordWithAppName(record) {
  if (!record) {
    return false;
  }
  if (record.id) {
    record = record.id;
  }
  let sourceDelimIdx = record.indexOf('@');
  let appDelimIdx = record.indexOf('/');
  return appDelimIdx > 0 && appDelimIdx < sourceDelimIdx;
}

function recordsFetch(url, body) {
  let withAppName = false;
  if (body.query) {
    withAppName = lodashGet(body, 'query.sourceId', '').indexOf('/') > -1;
  } else if (body.record) {
    withAppName = isRecordWithAppName(body.record);
  } else if (body.records) {
    withAppName = isAnyWithAppName(body.records);
  }

  if (withAppName) {
    url = GATEWAY_URL_MAP[url];
  }

  return fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-type': 'application/json;charset=UTF-8'
    },
    body: JSON.stringify(body)
  }).then(response => {
    return response.json().then(body => {
      if (response.status >= 200 && response.status < 300) {
        return body;
      }
      if (body.message) {
        throw new Error(body.message);
      } else {
        throw new Error(response.statusText);
      }
    });
  });
}

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

class RecordsComponent {
  constructor() {
    this._records = {};
  }

  get(id) {
    if (!id) {
      return new Record('');
    }
    if (id instanceof Record) {
      return id;
    }
    if (isArray(id)) {
      let result = id.map(i => this.get(i));
      result.load = function() {
        return Promise.all(this.map(r => r.load.apply(r, arguments)));
      };
      return result;
    }

    let rec = this._records[id];
    if (!rec) {
      rec = new Record(id);
      this._records[id] = rec;
    }
    return rec;
  }

  forget(id) {
    delete this._records[id];
  }

  getRecordToEdit(id) {
    let record = this.get(id);
    if (!record.isBaseRecord()) {
      return record;
    }
    let tmpId = id + '-alias-' + tmpRecordsCounter++;
    let result = new Record(tmpId, record);
    this._records[tmpId] = result;
    return result;
  }

  remove(records) {
    records = records.map(r => (r.id ? r.id : r));
    return recordsFetch(DELETE_URL, { records });
  }

  queryOne(query, attributes, defaultResult = null) {
    query = cloneDeep(query);

    let page = query.page || {};
    page.maxItems = 1;

    query.page = page;

    return this.query(query, attributes).then(resp => {
      if (resp.records.length === 0) {
        return defaultResult;
      }
      if (attributes && isString(attributes)) {
        return resp.records[0][attributes];
      }
      return resp.records[0];
    });
  }

  query(query, attributes, foreach) {
    if (query.attributes && arguments.length === 1) {
      attributes = query.attributes;
      query = query.query;
    }

    let self = this;

    let attributesMapping = {};

    let isSingleAttribute = attributes && isString(attributes);
    let queryAttributes = isSingleAttribute ? [attributes] : attributes || {};

    if (attributes) {
      if (Array.isArray(queryAttributes)) {
        for (let att of queryAttributes) {
          attributesMapping[att] = att;
        }
      } else {
        for (let att in queryAttributes) {
          if (queryAttributes.hasOwnProperty(att)) {
            attributesMapping[att] = queryAttributes[att];
          }
        }
      }
    }

    const processRespRecords = respRecords => {
      let records = [];
      for (let idx in respRecords) {
        if (!respRecords.hasOwnProperty(idx)) {
          continue;
        }

        let recordMeta = respRecords[idx];

        if (recordMeta.id) {
          let record = self.get(recordMeta.id);

          for (let att in recordMeta.attributes) {
            if (recordMeta.attributes.hasOwnProperty(att)) {
              record.persistedAtt(attributesMapping[att], recordMeta.attributes[att]);
            }
          }
        }
        if (attributes) {
          records.push(
            Object.assign(
              {
                id: recordMeta.id
              },
              recordMeta.attributes
            )
          );
        } else {
          records.push(recordMeta.id);
        }
      }

      return records;
    };

    let queryBody = {
      query: query,
      attributes: queryAttributes
    };

    if (foreach) {
      queryBody.foreach = foreach;
    }

    return recordsFetch(QUERY_URL, queryBody).then(response => {
      let records;
      if (!foreach) {
        records = processRespRecords(response.records);
      } else {
        records = [];
        let recordsArr = response.records || [];
        for (let resRecs of recordsArr) {
          records.push(processRespRecords(resRecs));
        }
      }

      return {
        records: records,
        hasMore: response.hasMore,
        totalCount: response.totalCount
      };
    });
  }
}

class Attribute {
  constructor(owner, name, persisted) {
    this._owner = owner;
    this._name = name;
    this._persisted = cloneDeep(persisted);
    this._value = null;
    this._wasChanged = false;
  }

  get persisted() {
    return this._persisted;
  }

  set persisted(value) {
    this._persisted = cloneDeep(value);
    this._value = null;
    this._wasChanged = false;
  }

  set value(value) {
    if (!isEqual(this._persisted, value)) {
      this._value = value;
      this._wasChanged = true;
    }
  }

  get value() {
    if (this._wasChanged) {
      return this._value;
    } else {
      return this.persisted;
    }
  }

  getValue() {
    return this.value;
  }

  setValue(value) {
    this.value = value;
  }

  getName() {
    return this._name;
  }

  isPersisted() {
    return !this._wasChanged;
  }
}

class Record {
  constructor(id, baseRecord) {
    this._id = id;
    this._attributes = {};
    this._changedSimpleValues = {};
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
        const attName = extractFirstAttName(att);
        if (attributes[attName] && !this._attributes[att].value) {
          continue;
        }
        attributes[attName] = this._attributes[att].value;
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
    let attributesObj = attributes;

    const isArrayOfIds = Array.isArray(self.id);
    if (isArrayOfIds) {
      force = true;
    }

    if (isSingleAttribute) {
      attributesObj = { a: attributes };
    } else if (Array.isArray(attributes)) {
      attributesObj = {};
      for (let v of attributes) {
        attributesObj[v] = v;
      }
    }

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
      result = recordsFetch(QUERY_URL, {
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
      return acc.concat(value.map(id => Records.get(id)).filter(r => !r.isPersisted()));
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

    return recordsFetch(MUTATE_URL, { records: requestRecords }).then(response => {
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
          Records.get(recordId).load(attributesToLoad[recordId], true);
        }
      }

      let resultId = ((response.records || [])[0] || {}).id;
      return resultId ? Records.get(resultId) : self;
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
      return (this._attributes[localName] || {}).value;
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

if (!window.Citeck) {
  window.Citeck = {};
}

window.Citeck = window.Citeck || {};
Records = window.Citeck.Records || new RecordsComponent();
window.Citeck.Records = Records;

export default Records;
