import _ from 'lodash';

import { mapValueToScalar } from './utils/attStrUtils';

const convertToFullAttributeName = (name: string, scalar: string | null, multiple: boolean): string => {
  if (multiple) {
    name += '[]';
  }
  return name + '?' + scalar;
};

class PersistedValue {
  private _att: Attribute;
  private _value: any;
  private _isLoaded: boolean;
  private _isArrayLoaded: boolean;
  private _scalar: string;

  constructor(att: Attribute, scalar: string) {
    this._att = att;
    this._value = [];
    this._isLoaded = false;
    this._isArrayLoaded = false;
    this._scalar = scalar;
  }

  private _convertAttResult(value: any, multiple: boolean): any {
    if (value && value.then) {
      return value.then((loaded: any) => this._convertAttResult(loaded, multiple));
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
  }

  getValue(multiple?: boolean, withLoading?: boolean, forceReload?: boolean): any {
    const att = this._att as any;
    const isVirtualRec = att._record.isVirtual();

    if (isVirtualRec) {
      const baseRecord = att._record._baseRecord;
      if ((!this._value || !this._value.length) && baseRecord) {
        this._value = baseRecord.att(att.getName() + '[]');
      }
    } else if (withLoading && (!this._isLoaded || forceReload || (multiple && !this._isArrayLoaded))) {
      const attributeToLoad = convertToFullAttributeName(att.getName(), this._scalar, !!multiple);

      this._value = att._record._loadRecordAttImpl(attributeToLoad, forceReload);
      this._isLoaded = true;
      this._isArrayLoaded = !!multiple;
      if (this._value != null && this._value.then) {
        this._value = this._value
          .then((res: any) => {
            if (res === null || res === undefined) {
              this._value = [];
            } else if (!multiple) {
              this._value = [res];
            } else {
              this._value = res;
            }
            return this._value;
          })
          .catch((e: any) => {
            console.error(e);
            this._value = [];
            return this._value;
          });
      }
    }

    return this._convertAttResult(this._value, !!multiple);
  }

  setValue(value: any): void {
    if (_.isArray(value)) {
      this._value = value;
    } else {
      this._value = [value];
    }
    this._isLoaded = true;
    this._isArrayLoaded = true;
  }
}

export default class Attribute {
  protected _record: any;
  protected _name: string;
  protected _persisted: Record<string, PersistedValue>;
  protected _newValue: any;
  protected _newValueScalar: string | null;
  protected _wasChanged: boolean;
  protected _readyToSave: boolean;
  protected _multiple: boolean;

  constructor(record: any, name: string) {
    this._record = record;
    this._name = name;
    this._persisted = {};
    this._newValue = null;
    this._newValueScalar = null;
    this._wasChanged = false;
    this._readyToSave = true;
    this._multiple = false;
  }

  getName(): string {
    return this._name;
  }

  isPersisted(): boolean {
    return !this._wasChanged;
  }

  isReadyToSave(): boolean {
    return this._readyToSave;
  }

  getNewValueAttName(): string {
    return convertToFullAttributeName(this.getName(), this.getNewValueInnerAtt(), false);
  }

  getNewValueInnerAtt(): string | null {
    return this._newValueScalar;
  }

  getPersistedValue(scalar: any = this._newValueScalar, multiple = this._multiple, withLoading?: boolean, forceReload?: boolean): any {
    if (!scalar) {
      if (Object.keys(this._persisted).length === 0) {
        return multiple ? [] : null;
      } else {
        const value = this._persisted['str'] || this._persisted['disp'] || this._persisted[Object.keys(this._persisted)[0]];
        return value.getValue(multiple, false);
      }
    }
    let value = this._persisted[scalar];
    if (!value) {
      value = new PersistedValue(this, scalar);
      this._persisted[scalar] = value;
    }

    const result = value.getValue(multiple, withLoading, forceReload);
    if (scalar === 'disp') {
      if (result === null || result === undefined) {
        return this.getPersistedValue('str', multiple, false);
      } else if (result.then) {
        return result.then((v: any) => {
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

  setPersistedValue(scalar: any, value: any): void {
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

  getValue(scalar: any = this._newValueScalar, multiple = this._multiple, withLoading?: boolean, forceReload?: boolean): any {
    if (this._wasChanged) {
      return this._newValue;
    } else {
      return this.getPersistedValue(scalar, multiple, withLoading, forceReload);
    }
  }

  setValue(scalar: any, value: any): any {
    scalar = scalar || mapValueToScalar(value);

    const persisted = this.getPersistedValue(scalar, _.isArray(value), true);

    const updateValue = (currentValue: any) => {
      this._readyToSave = true;

      if (!_.isEqual(currentValue, value)) {
        this._newValue = _.cloneDeep(value);
        this._newValueScalar = scalar;
        this._wasChanged = true;
        this._multiple = _.isArray(value);
      } else {
        this._newValue = null;
        this._newValueScalar = null;
        this._wasChanged = false;
        this._multiple = _.isArray(currentValue);
      }
      return value;
    };

    this._readyToSave = false;

    if (persisted && persisted.then) {
      return persisted.then(updateValue).catch((e: any) => {
        this._readyToSave = true;
        throw e;
      });
    } else {
      return updateValue(persisted);
    }
  }
}
