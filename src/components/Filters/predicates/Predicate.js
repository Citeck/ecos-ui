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
}
