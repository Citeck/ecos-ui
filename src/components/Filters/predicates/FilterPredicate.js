import WrapperPredicate from './WrapperPredicate';
import { getId } from '../../../helpers/util';

export default class FilterPredicate extends WrapperPredicate {
  constructor({ condition, predicate, columns = [] }) {
    super({ condition, predicate, columns });

    this.id = getId();
  }

  update(predicate) {
    this.predicate = { ...this.predicate, ...predicate };
  }
}
