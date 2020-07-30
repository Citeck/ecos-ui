import _ from 'lodash';
import { mapValueToScalar } from './utils/attStrUtils';

const convertToFullAttributeName = (name, scalar, multiple) => {
  if (multiple) {
    name += '[]';
  }
  return name + '?' + scalar;
};

const PersistedValue = function(att, scalar) {
  this._att = att;
  this._value = [];
  this._isLoaded = false;
  this._isArrayLoaded = false;
  this._scalar = scalar;

  this._convertAttResult = (value, multiple) => {
    if (value && value.then) {
      return value.then(loaded => this._convertAttResult(loaded, multiple));
    }

    if (multiple) {
      if (_.isArray(value)) {
        return value;
      } else if (value === null) {
        return [];
      } else {
        return [value];
      }
    } else {
      if (_.isArray(value)) {
        return value.length > 0 ? value[0] : null;
      } else {
        return value;
      }
    }
  };

  this.getValue = (multiple, withLoading, forceReload) => {
    let isVirtualRec = this._att._record.isVirtual();

    if (isVirtualRec) {
      let baseRecord = this._att._record._baseRecord;
      if ((!this._value || !this._value.length) && baseRecord) {
        this._value = baseRecord.att(this._att.getName() + '[]');
      }
    } else if (withLoading && (!this._isLoaded || forceReload || (multiple && !this._isArrayLoaded))) {
      let attributeToLoad = convertToFullAttributeName(this._att.getName(), this._scalar, multiple);

      this._value = this._att._record._loadRecordAttImpl(attributeToLoad, forceReload);
      this._isLoaded = true;
      this._isArrayLoaded = multiple;
      if (this._value != null && this._value.then) {
        this._value = this._value
          .then(res => {
            if (res === null || res === undefined) {
              this._value = [];
            } else if (!multiple) {
              this._value = [res];
            } else {
              this._value = res;
            }
            return this._value;
          })
          .catch(e => {
            console.error(e);
            this._value = [];
            return this._value;
          });
      }
    }

    return this._convertAttResult(this._value, multiple);
  };

  this.setValue = value => {
    if (_.isArray(value)) {
      this._value = value;
    } else {
      this._value = [value];
    }
    this._isLoaded = true;
    this._isArrayLoaded = true;
  };
};

export default class Attribute {
  constructor(record, name) {
    this._record = record;
    this._name = name;
    this._persisted = {};
    this._newValue = null;
    this._newValueScalar = null;
    this._wasChanged = false;
    this._readyToSave = true;
  }

  getName() {
    return this._name;
  }

  isPersisted() {
    return !this._wasChanged;
  }

  isReadyToSave() {
    return this._readyToSave;
  }

  getNewValueAttName() {
    return convertToFullAttributeName(this.getName(), this.getNewValueInnerAtt(), false);
  }

  getNewValueInnerAtt() {
    return this._newValueScalar;
  }

  getPersistedValue(scalar, multiple, withLoading, forceReload) {
    if (!scalar) {
      if (Object.keys(this._persisted).length === 0) {
        return multiple ? [] : null;
      } else {
        let value = this._persisted['str'] || this._persisted['disp'] || this._persisted[Object.keys(this._persisted)[0]];
        return value.getValue(multiple, false);
      }
    }
    let value = this._persisted[scalar];
    if (!value) {
      value = new PersistedValue(this, scalar);
      this._persisted[scalar] = value;
    }

    let result = value.getValue(multiple, withLoading, forceReload);
    if (scalar === 'disp') {
      if (result === null || result === undefined) {
        return this.getPersistedValue('str', multiple, false);
      } else if (result.then) {
        return result.then(v => {
          if (v === null) {
            return this.getPersistedValue('str', multiple, false);
          } else {
            return v;
          }
        });
      }
    }
    if (scalar === 'assoc') {
      if (result === null) {
        return this.getPersistedValue('str', multiple, false);
      }
    }
    return result;
  }

  setPersistedValue(scalar, value) {
    scalar = scalar || mapValueToScalar(value);
    let persistedValue = this._persisted[scalar];
    if (!persistedValue) {
      persistedValue = new PersistedValue(this, scalar);
      this._persisted[scalar] = persistedValue;
    }
    persistedValue.setValue(_.cloneDeep(value));

    this._newValue = null;
    this._newValueScalar = null;
    this._wasChanged = false;
  }

  getValue(scalar, multiple, withLoading, forceReload) {
    if (this._wasChanged) {
      return this._newValue;
    } else {
      return this.getPersistedValue(scalar, multiple, withLoading, forceReload);
    }
  }

  setValue(scalar, value) {
    scalar = scalar || mapValueToScalar(value);

    let persisted = this.getPersistedValue(scalar, _.isArray(value), true);

    const updateValue = currentValue => {
      this._readyToSave = true;

      if (!_.isEqual(currentValue, value)) {
        this._newValue = _.cloneDeep(value);
        this._newValueScalar = scalar;
        this._wasChanged = true;
      } else {
        this._newValue = null;
        this._newValueScalar = null;
        this._wasChanged = false;
      }
      return value;
    };

    this._readyToSave = false;

    if (persisted && persisted.then) {
      return persisted.then(updateValue).catch(e => {
        this._readyToSave = true;
        throw e;
      });
    } else {
      return updateValue(persisted);
    }
  }
}
