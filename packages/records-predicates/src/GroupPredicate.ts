import WrapperPredicate from './WrapperPredicate';

export default class GroupPredicate extends WrapperPredicate {
  filters: any[];

  constructor({ condition, predicate, filters, columns = [] }: { condition: any; predicate: any; filters?: any[]; columns?: any[] }) {
    super({ condition, predicate, columns });

    this.filters = filters || [];
  }

  add(predicate: any): void {
    this.predicate.val.push(predicate);
  }

  getFilters(): any[] {
    return this.filters;
  }
}
