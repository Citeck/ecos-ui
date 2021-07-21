import WrapperPredicate from './WrapperPredicate';

export default class GroupPredicate extends WrapperPredicate {
  constructor({ condition, predicate, filters, columns = [] }) {
    super({ condition, predicate, columns });

    this.filters = filters || [];
  }

  add(predicate) {
    this.predicate.val.push(predicate);
  }

  getFilters() {
    return this.filters;
  }
}
