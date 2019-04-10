export default class WrapperPredicate {
  constructor({ condition, predicate, columns }) {
    this.meta = {
      column: columns.filter(column => column.attribute === predicate.att)[0] || {},
      condition
    };
    this.predicate = predicate;
  }

  getCondition() {
    return this.meta.condition.value;
  }

  setCondition(condition) {
    this.meta.condition = { ...this.meta.condition, value: condition };
  }

  getConditionLabel() {
    return this.meta.condition.label;
  }

  getPredicate() {
    return this.predicate;
  }
}
