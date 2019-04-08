import WrapperPredicate from './WrapperPredicate';

export default class GroupPredicate extends WrapperPredicate {
  constructor(condition, predicate, filters) {
    super(condition, predicate, filters);
    this.filters = filters || [];
  }

  add(predicate) {
    this.predicate.val.push(predicate);
  }
}
