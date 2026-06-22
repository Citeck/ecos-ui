export interface WrapperPredicateInit {
  condition: any;
  predicate: any;
  columns: any[];
}

export default class WrapperPredicate {
  meta: { column: any; condition: any };
  predicate: any;

  constructor({ condition, predicate, columns }: WrapperPredicateInit) {
    this.meta = {
      column: columns.filter(column => column.attribute === predicate.att)[0] || {},
      condition
    };
    this.predicate = predicate;
  }

  getCondition(): any {
    return this.meta.condition.value;
  }

  setCondition(condition: any): void {
    this.meta.condition = { ...this.meta.condition, value: condition };
  }

  getConditionLabel(): any {
    return this.meta.condition.label;
  }

  getPredicate(): any {
    return this.predicate;
  }
}
