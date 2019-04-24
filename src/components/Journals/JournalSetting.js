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
    console.log('setPredicate:', this.model.predicate);
  }

  setColumnsSetup(columnsSetup) {
    this.columnsSetup = { ...columnsSetup };
    console.log('columnsSetup:', this.columnsSetup);
  }

  setGrouping(grouping) {
    this.grouping = { ...grouping };
    console.log('grouping:', this.grouping);
  }

  getSetting() {
    return null;
  }
}
