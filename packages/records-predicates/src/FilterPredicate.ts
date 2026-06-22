import WrapperPredicate from './WrapperPredicate';
import { getId } from './utils';

export default class FilterPredicate extends WrapperPredicate {
  id: string;

  constructor({ condition, predicate, columns = [] }: { condition: any; predicate: any; columns?: any[] }) {
    super({ condition, predicate, columns });

    this.id = getId();
  }

  update(predicate: any): void {
    this.predicate = { ...this.predicate, ...predicate };
  }
}
