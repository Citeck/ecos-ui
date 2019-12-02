import _ from 'lodash';
import { loadAttribute } from './recordsApi';

const mapValueToPersistedKey = value => {
  if (value === null || value === undefined || _.isString(value) || _.isDate(value)) {
    return 'str';
  } else if (_.isNumber(value)) {
    return 'num';
  } else if (_.isObject(value) || _.isArray(value)) {
    return 'json';
  } else if (_.isBoolean(value)) {
    return 'bool';
  } else {
    return 'str';
  }
};

const PersistedValue = (att, valueKey) => {
  this._att = att;
  this._value = null;
  this._isLoaded = false;
  this._valueKey = valueKey;

  this.getValue = forceReload => {
    if (!this._isLoaded || forceReload) {
      this._value = loadAttribute(this._att._recordId, this._att.getName() + '[]?' + this._valueKey);
      this._isLoaded = true;
      if (this._value != null && this._value.then) {
        this._value
          .then(res => {
            this._value = res;
          })
          .catch(e => {
            console.error(e);
            this._value = null;
          });
      }
    }
    return this._value;
  };

  this.setValue = value => {
    if (value === null) {
      this._value = [];
    } else if (_.isArray(value)) {
      this._value = value;
    } else {
      this._value = [value];
    }
    this._isLoaded = true;
  };
};

export default class Attribute {
  constructor(recordId, name) {
    this._recordId = recordId;
    this._name = name;
    this._persisted = {};
    this._newValue = null;
    this._wasChanged = false;
  }

  getName() {
    return this._name;
  }

  isPersisted() {
    return !this._wasChanged;
  }

  getPersistedValue(key, forceReload) {
    if (this._wasChanged) {
      return this._newValue;
    } else {
      let value = this._persisted[key];
      if (!value) {
        value = new PersistedValue();
        this._persisted[key] = value;
      }
      return value.getValue(forceReload);
    }
  }

  setPersistedValue(value) {
    const key = mapValueToPersistedKey(value);
    let persistedValue = this._persisted[key];
    if (!value) {
      persistedValue = new PersistedValue();
      this._persisted[key] = persistedValue;
    }
    persistedValue.setValue(_.cloneDeep(value));

    this._newValue = null;
    this._wasChanged = false;
  }

  getValue(key, forceReload) {
    if (this._wasChanged) {
      return this._newValue;
    } else {
      return this.getPersistedValue(key, forceReload);
    }
  }

  setValue(value) {
    let persisted = this.getPersistedValue(mapValueToPersistedKey(value));

    if (!_.isEqual(persisted, value)) {
      this._newValue = _.cloneDeep(value);
      this._wasChanged = true;
    } else {
      this._newValue = null;
      this._wasChanged = false;
    }
  }

  isMultiple() {
    return Array.isArray(this.getValue());
  }
}
