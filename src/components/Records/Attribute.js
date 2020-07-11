import _ from 'lodash';
import { mapValueToInnerAtt } from './recordUtils';

const scalarFields = ['disp', 'json', 'str', 'num', 'bool', 'id', 'assoc'];

const innerAttsMapping = {};
for (let field of scalarFields) {
  innerAttsMapping['.' + field] = field;
}

const convertInnerAtt = innerAtt => {
  if (!innerAtt) {
    return innerAtt;
  }
  return innerAttsMapping[innerAtt] || innerAtt;
};

const convertToFullAttributeName = (name, inner, multiple, modifier) => {
  let fullAttName;

  if (inner.charAt(0) === '.') {
    fullAttName = '.att' + (multiple ? 's' : '') + '(n:"' + name + '"){' + inner.substring(1) + '}';
  } else {
    fullAttName = name + (multiple ? '[]' : '');
    const hasBracket = inner.indexOf('{') > -1;
    const hasQChar = inner.indexOf('?') > -1;

    if (hasBracket || hasQChar) {
      fullAttName += '.' + inner;
    } else {
      const isScalar = scalarFields.indexOf(inner) > -1;
      fullAttName += isScalar ? '?' + inner : '{' + inner + '}';
    }
  }

  return fullAttName + modifier;
};

const PersistedValue = function(att, innerAtt, modifier) {
  this._att = att;
  this._value = null;
  this._isLoaded = false;
  this._isArrayLoaded = false;
  this._innerAtt = innerAtt;
  this._modifier = modifier;

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
      var baseRecord = this._att._record._baseRecord;
      if (!this._value && baseRecord) {
        this._value = baseRecord.att(this._att.getName() + '[]');
      }
    } else if (withLoading && (!this._isLoaded || forceReload || (multiple && !this._isArrayLoaded))) {
      let attributeToLoad = convertToFullAttributeName(this._att.getName(), this._innerAtt, multiple, this._modifier);

      this._value = this._att._record._loadRecordAttImpl(attributeToLoad, forceReload);
      this._isLoaded = true;
      this._isArrayLoaded = multiple;
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

    const isMultiValueRes = multiple || this._innerAtt.indexOf('[]') !== -1 || this._innerAtt.indexOf('atts(') !== -1;

    return this._convertAttResult(this._value, isMultiValueRes);
  };

  this.setValue = value => {
    this._value = value;
    this._isLoaded = true;
    this._isArrayLoaded = true;
  };
};

export default class Attribute {
  constructor(record, name, modifier) {
    this._record = record;
    this._name = name;
    this._persisted = {};
    this._newValue = null;
    this._newValueInnerAtt = null;
    this._wasChanged = false;
    this._readyToSave = true;
    this._modifier = modifier || '';
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
    return this._newValueInnerAtt;
  }

  getPersistedValue(innerAtt, multiple, withLoading, forceReload) {
    innerAtt = convertInnerAtt(innerAtt);

    if (!innerAtt) {
      if (Object.keys(this._persisted).length === 0) {
        return multiple ? [] : null;
      } else {
        let value = this._persisted['str'] || this._persisted['disp'] || this._persisted[Object.keys(this._persisted)[0]];
        return value.getValue(multiple, false);
      }
    }
    if (_.isArray(innerAtt)) {
      innerAtt = innerAtt.join(',');
    }
    let value = this._persisted[innerAtt];
    if (!value) {
      value = new PersistedValue(this, innerAtt, this._modifier);
      this._persisted[innerAtt] = value;
    }

    let result = value.getValue(multiple, withLoading, forceReload);
    if (innerAtt === 'disp') {
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
    if (innerAtt === 'assoc') {
      if (result === null) {
        return this.getPersistedValue('str', multiple, false);
      }
    }
    return result;
  }

  setPersistedValue(innerAtt, value) {
    innerAtt = convertInnerAtt(innerAtt) || mapValueToInnerAtt(value);
    let persistedValue = this._persisted[innerAtt];
    if (!persistedValue) {
      persistedValue = new PersistedValue(this, innerAtt, this._modifier);
      this._persisted[innerAtt] = persistedValue;
    }
    persistedValue.setValue(_.cloneDeep(value));

    this._newValue = null;
    this._newValueInnerAtt = null;
    this._wasChanged = false;
  }

  getValue(innerAtt, multiple, withLoading, forceReload) {
    if (this._wasChanged) {
      return this._newValue;
    } else {
      innerAtt = convertInnerAtt(innerAtt);
      return this.getPersistedValue(innerAtt, multiple, withLoading, forceReload);
    }
  }

  setValue(innerAtt, value) {
    innerAtt = convertInnerAtt(innerAtt) || mapValueToInnerAtt(value);

    let persisted = this.getPersistedValue(innerAtt, _.isArray(value), true);

    const updateValue = currentValue => {
      this._readyToSave = true;

      if (!_.isEqual(currentValue, value)) {
        this._newValue = _.cloneDeep(value);
        this._newValueInnerAtt = innerAtt;
        this._wasChanged = true;
      } else {
        this._newValue = null;
        this._newValueInnerAtt = null;
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
