import cloneDeep from 'lodash/cloneDeep';

const QUERY_URL = '/share/proxy/alfresco/citeck/ecos/records/query';
const DELETE_URL = '/share/proxy/alfresco/citeck/ecos/records/delete';
const MUTATE_URL = '/share/proxy/alfresco/citeck/ecos/records/mutate';

let records;

function convertAttributePath(path) {
  if (path[0] === '.') {
    return path;
  }
  if (!path) {
    return null;
  }

  let attName;
  let attSchema;
  let attPath = path;

  let isEdge = path[0] === '#';
  if (isEdge) {
    attPath = attPath.substring(1);
  }

  let qIdx = attPath.indexOf('?');
  if (qIdx >= 0) {
    attName = attPath.substring(0, qIdx);
    attSchema = attPath.substring(qIdx + 1);
  } else {
    if (isEdge) {
      throw new Error("Incorrect attribute: '" + path + "'. Missing ?...");
    }
    attName = attPath;
    attSchema = 'disp';
  }

  let result = '.';

  if (isEdge) {
    result += 'edge(n:"' + attName + '"){' + attSchema + '}';
  } else {
    let attPath = attName.split(/(?<!\\)\./);
    for (let i = 0; i < attPath.length; i++) {
      if (i > 0) {
        result += '{';
      }
      result += 'att';

      let pathElem = attPath[i];
      if (pathElem.indexOf('[]') === pathElem.length - 2) {
        result += 's';
        pathElem = pathElem.substring(0, pathElem.length - 2);
      }
      pathElem = pathElem.replace(/\\./g, '.');

      result += '(n:"' + pathElem + '")';
    }

    result += '{' + attSchema + '}';
    for (let i = 1; i < attPath.length; i++) {
      result += '}';
    }
  }

  return result;
}

class Records {
  constructor() {
    this._records = {};
  }

  get(id) {
    if (id.indexOf('@') === id.length - 1) {
      return new Record(id);
    }
    let rec = this._records[id];
    if (!rec) {
      rec = new Record(id);
      this._records[id] = rec;
    }
    return rec;
  }

  remove(records) {
    return new Promise(function(resolve, reject) {
      fetch(DELETE_URL, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-type': 'application/json;charset=UTF-8'
        },
        body: JSON.stringify({
          records: records
        })
      })
        .then(response => {
          return response.json();
        })
        .then(response => {
          resolve(response);
        })
        .catch(e => {
          reject(e);
        });
    });
  }

  queryOne(query, attributes) {
    query = cloneDeep(query);

    let page = query.page || {};
    page.maxItems = 1;

    query.page = page;

    return this.query({
      query: query,
      attributes: attributes || {}
    }).then(resp => {
      if (resp.records.length === 0) {
        return null;
      }
      return resp.records[0];
    });
  }

  query(body) {
    let self = this;

    let attributesMapping = {};

    if (body.attributes) {
      for (let att in body.attributes) {
        if (body.attributes.hasOwnProperty(att)) {
          attributesMapping[att] = body.attributes[att];
        }
      }
    }

    return new Promise(function(resolve, reject) {
      fetch(QUERY_URL, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-type': 'application/json;charset=UTF-8'
        },
        body: JSON.stringify(body)
      })
        .then(response => {
          return response.json();
        })
        .then(response => {
          let records = [];
          for (let idx in response.records) {
            if (!response.records.hasOwnProperty(idx)) {
              continue;
            }

            let recordMeta = response.records[idx];

            if (recordMeta.id) {
              let record = self.get(recordMeta.id);

              for (let att in recordMeta.attributes) {
                if (recordMeta.attributes.hasOwnProperty(att)) {
                  record.att(attributesMapping[att], recordMeta.attributes[att]);
                }
              }
            }

            records.push(
              Object.assign(
                {
                  id: recordMeta.id
                },
                recordMeta.attributes
              )
            );
          }

          resolve({
            records: records,
            hasMore: response.hasMore,
            totalCount: response.totalCount
          });
        });
    });
  }
}

class Attribute {
  constructor(owner, name, persisted) {
    this._owner = owner;
    this._name = name;
    this._persisted = persisted;
    this._value = persisted;
  }

  get persisted() {
    return this._persisted;
  }

  set value(value) {
    this._value = value;
  }

  get value() {
    if (this._value != null) {
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
    return this._value === this.persisted;
  }
}

class Record {
  constructor(id) {
    this._id = id;
    this._attributes = {};
  }

  get id() {
    return this._id;
  }

  static set id(v) {
    throw new Error('id is a constant field!');
  }

  load(attributes, force) {
    let self = this;

    let toLoad = [];
    let toLoadNames = {};
    let loaded = {};

    for (let att in attributes) {
      if (!attributes.hasOwnProperty(att)) {
        continue;
      }

      let attPath = convertAttributePath(attributes[att]);

      if (!force) {
        let existingValue = self._attributes[attPath];
        if (existingValue) {
          loaded[att] = existingValue.value;
        } else {
          toLoad.push(attPath);
          toLoadNames[attPath] = att;
        }
      } else {
        toLoad.push(attPath);
        toLoadNames[attPath] = att;
      }
    }

    if (toLoad.length === 0) {
      return Promise.resolve(loaded);
    }

    return new Promise(function(resolve, reject) {
      fetch(QUERY_URL, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-type': 'application/json;charset=UTF-8'
        },
        body: JSON.stringify({
          record: self.id,
          attributes: toLoad
        })
      })
        .then(response => {
          return response.json();
        })
        .then(response => {
          let atts = response.attributes || {};
          for (let att in atts) {
            if (!atts.hasOwnProperty(att)) {
              continue;
            }
            loaded[toLoadNames[att]] = atts[att];
            self._attributes[att] = new Attribute(self, att, atts[att]);
          }

          resolve(loaded);
        });
    });
  }

  loadAttribute(attribute) {
    let self = this;

    return new Promise(function(resolve, reject) {
      self
        .load({
          a: attribute
        })
        .then(atts => {
          resolve(atts.a);
        })
        .catch(e => {
          console.error(e);
          reject(e);
        });
    });
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

  save() {
    let self = this;

    let attributesToPersist = {};

    let sumbitRequired = false;
    for (let attName in self._attributes) {
      if (!self._attributes.hasOwnProperty(attName)) {
        continue;
      }

      let attribute = self._attributes[attName];

      if (!attribute.isPersisted()) {
        attributesToPersist[attName] = attribute.value;
        sumbitRequired = true;
      }
    }

    return new Promise(function(resolve, reject) {
      if (sumbitRequired) {
        fetch(MUTATE_URL, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-type': 'application/json;charset=UTF-8'
          },
          body: JSON.stringify({
            record: {
              id: self.id,
              attributes: attributesToPersist
            }
          })
        })
          .then(response => {
            return response.json();
          })
          .then(response => {
            let attributesToLoad = {};

            for (let att in attributesToPersist) {
              if (attributesToPersist.hasOwnProperty(att)) {
                attributesToLoad[att] = att;
              }
            }

            let record = response.id ? records.get(response.id) : self.id;

            record.load(attributesToLoad, true).then(() => {
              resolve(record);
            });
          });
      } else {
        resolve(self);
      }
    });
  }

  att(name, value) {
    if (!name) {
      return;
    }

    let localName = convertAttributePath(name);

    if (arguments.length > 1) {
      let attribute = this._attributes[localName];
      if (!attribute) {
        attribute = new Attribute(null);
        this._attributes[localName] = attribute;
      }
      attribute.value = value;
    } else {
      return (this._attributes[localName] || {}).value;
    }
  }
}

if (!window.Citeck) {
  window.Citeck = {};
}

window.Citeck = window.Citeck || {};
records = window.Citeck.Records || new Records();
window.Citeck.Records = records;

export default records;
