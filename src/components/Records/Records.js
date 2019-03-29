const QUERY_URL = '/share/proxy/alfresco/citeck/ecos/records/query';
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

  return '.' + (isEdge ? 'edge' : 'att') + '(n:"' + attName + '"){' + attSchema + '}';
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

            records.push(recordMeta);
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

            self.load(attributesToLoad, true).then(() => {
              resolve(self);
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

    if (arguments.length > 1) {
      let attribute = this._attributes[name];
      if (!attribute) {
        attribute = new Attribute(null);
        this._attributes[name] = attribute;
      }
      attribute.value = value;
    } else {
      return (this._attributes[name] || {}).value;
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
