export default class JournalSetting {
  constructor() {
    this.example = {
      id: 'contract-agreements',
      journalId: 'contract-agreements',
      title: 'ысфывафы',
      sortBy: [
        {
          attribute: 'cm:created',
          ascending: false
        },
        {
          attribute: 'cm:title',
          ascending: true
        }
      ],
      groupBy: ['contracts:contractor'],
      columns: [
        {
          attr: 'cm:created'
        },
        {
          attr: 'cm:title'
        },
        {
          attr: 'contracts:contractor'
        }
      ],
      predicate: null,
      maxItems: 10,
      permissions: {
        Write: true,
        Delete: true
      }
    };

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
    this.model.predicate = { ...predicate };
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

  getSetting() {
    const groupingColumns = this.grouping.columns;
    const columnsSetupColumns = this.columnsSetup.columns;

    if (groupingColumns.length) {
      this.setColumns(groupingColumns);
    } else {
      this.setColumns(columnsSetupColumns);
    }

    console.log(this.model);

    return null; //this.model.predicate;
  }
}
