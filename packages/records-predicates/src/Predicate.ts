import isArray from 'lodash/isArray';
import isString from 'lodash/isString';

export interface PredicateInit {
  att?: any;
  t?: any;
  val?: any;
}

export default class Predicate {
  att: any;
  t: any;
  val: any;

  static isPredicate(predicate: any): predicate is Predicate {
    return predicate instanceof Predicate;
  }

  constructor({ att, t, val }: PredicateInit) {
    this.att = att;
    this.t = t;
    this.val = val;
  }

  add(item: any): void {
    this.val.push(item);
  }

  setVal(value: any): void {
    this.val = value;
  }

  setT(t: any): void {
    this.t = t;
  }

  static isEndVal(val: any): boolean {
    return isString(val) || (isArray(val) && val.every(isString));
  }
}
