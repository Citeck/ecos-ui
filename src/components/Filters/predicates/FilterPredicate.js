import WrapperPredicate from './WrapperPredicate';

export default class FilterPredicate extends WrapperPredicate {
  constructor({ condition, predicate, columns = [] }) {
    super({ condition, predicate, columns });
  }

  update(predicate) {
    this.predicate = { ...this.predicate, ...predicate };
  }
}
