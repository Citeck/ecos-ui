import WrapperPredicate from './WrapperPredicate';

export default class FilterPredicate extends WrapperPredicate {
  constructor(condition, predicate) {
    super(condition, predicate);
  }

  update(predicate) {
    this.predicate = { ...this.predicate, ...predicate };
  }
}
