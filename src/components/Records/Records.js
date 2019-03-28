const QUERY_URL = '/share/proxy/alfresco/citeck/ecos/records/query';
const MUTATE_URL = '/share/proxy/alfresco/citeck/ecos/records/mutate';

let records;

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
        attributesMapping[att] = body.attributes[att];
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
            let recordMeta = response.records[idx];

            if (recordMeta.id) {
              let record = self.get(recordMeta.id);

              for (let att in recordMeta.attributes) {
                record.att(attributesMapping[att], recordMeta.attributes[att]);
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

  set id(v) {
    throw new Error('id is a constant field!');
  }

  load(attributes, force) {
    let self = this;

    let toLoad = [];
    let toLoadNames = {};
    let loaded = {};

    for (let att in attributes) {
      let attName = attributes[att];

      if (!force) {
        let existingValue = self._attributes[attName];
        if (existingValue) {
          loaded[att] = existingValue.value;
        } else {
          toLoad.push(attName);
          toLoadNames[attName] = att;
        }
      } else {
        toLoad.push(attName);
        toLoadNames[attName] = att;
      }
    }

    return new Promise(function(resolve, reject) {
      if (toLoad.length > 0) {
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
      } else {
        resolve(loaded);
      }
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
            var attributesToLoad = {};

            for (let att in attributesToPersist) {
              attributesToLoad[att] = att;
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
