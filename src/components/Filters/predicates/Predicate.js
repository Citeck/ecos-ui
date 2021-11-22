import isArray from 'lodash/isArray';
import isString from 'lodash/isString';

export default class Predicate {
  constructor({ att, t, val }) {
    this.att = att;
    this.t = t;
    this.val = val;
  }

  add(item) {
    this.val.push(item);
  }

  setVal(value) {
    this.val = value;
  }

  setT(t) {
    this.t = t;
  }

  static isEndVal(val) {
    return isString(val) || (isArray(val) && val.every(isString));
  }
}
