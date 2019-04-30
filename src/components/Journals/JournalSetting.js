export default class JournalSetting {
  constructor() {
    this.columnsSetup = {};
    this.grouping = {};

    this.model = {
      id: '',
      journalId: '',
      title: '',
      sortBy: [],
      groupBy: [],
      columns: [],
      predicate: null,
      maxItems: 10,
      permissions: {
        Write: true,
        Delete: true
      }
    };
  }

  setPredicate(predicate) {
    this.model.predicate = predicate;
  }

  setGroupBy(groupBy) {
    this.model.groupBy = Array.from(groupBy);
  }

  setSortBy(sortBy) {
    this.model.sortBy = Array.from(sortBy);
  }

  setColumns(columns) {
    this.model.columns = Array.from(columns);
  }

  setColumnsSetup(columnsSetup) {
    this.columnsSetup = { ...columnsSetup };
    this.setSortBy(this.columnsSetup.sortBy || []);
  }

  setGrouping(grouping) {
    this.grouping = { ...grouping };
    this.setGroupBy(this.grouping.groupBy || []);
  }

  getSetting(title) {
    const groupingColumns = this.grouping.columns || [];
    const columnsSetupColumns = this.columnsSetup.columns;

    if (groupingColumns.length) {
      this.setColumns(groupingColumns);
    } else {
      this.setGroupBy([]);
      this.setColumns(columnsSetupColumns);
    }

    this.model.title = title;

    return this.model;
  }
}
