import journalsService from '../journalsService';
import journalsServiceApi from '../__mocks__/journalsServiceApi';

jest.mock('../journalsServiceApi');

const SCRIPT_COMPUTED_RES = 'script computed result';
const SCRIPT_COMPUTED_NAME = 'scriptComputed';

const QUERY_COMPUTED_NAME = 'queryComputed';
const QUERY_COMPUTED_VALUE_ATTRIBUTE = 'Name1';

const ATTRIBUTES_COMPUTED_NAME = 'attributesComputed';
const ATTRIBUTES_COMPUTED_REC = 'rec0';
const ATTRIBUTES_COMPUTED_ATTS = { Name1: 'Name1' };

const JOURNAL_CONFIG = {
  id: 'test-journal',
  computed: [
    {
      type: 'script',
      name: SCRIPT_COMPUTED_NAME,
      config: {
        script: 'return new Promise(resolve => setTimeout(() => { resolve("' + SCRIPT_COMPUTED_RES + '"); }, 100));'
      }
    },
    {
      type: 'query',
      name: QUERY_COMPUTED_NAME,
      config: {
        query: { query: 'test', language: 'predicate' },
        attributes: { value: QUERY_COMPUTED_VALUE_ATTRIBUTE }
      }
    },
    {
      type: 'attributes',
      name: ATTRIBUTES_COMPUTED_NAME,
      config: {
        record: ATTRIBUTES_COMPUTED_REC,
        attributes: ATTRIBUTES_COMPUTED_ATTS
      }
    }
  ],
  columns: [
    {
      name: 'Name1',
      label: 'Name 1 field'
    },
    {
      name: 'Name2',
      multiple: true,
      label: 'Name 2 field'
    },
    {
      name: 'Name3',
      label: 'Name 3 field'
    },
    {
      name: 'Name4',
      multiple: true,
      label: 'Name 4 field',
      innerSchema: 'disp:.disp,id:.id'
    },
    {
      name: 'Name5',
      label: 'Name 5 field',
      innerSchema: 'disp:.disp,id:.id'
    }
  ],
  groupBy: ['icase:caseStatusAssoc']
};

const RECORDS = [
  {
    id: 'rec0',
    Name1: 'Rec0 Name1 value'
  },
  {
    id: 'rec1',
    Name1: 'Rec1 Name1 value'
  },
  {
    id: 'rec2',
    Name1: 'Rec2 Name1 value'
  },
  {
    id: 'rec3',
    Name1: 'Rec3 Name1 value'
  }
];

describe('JournalsService', () => {
  it('Empty config test', async () => {
    let config = await journalsService.getJournalConfig(JOURNAL_CONFIG.id);
    expect(config.id).toEqual(undefined);
  });

  it('Test journal config', async () => {
    journalsServiceApi.setConfig(JOURNAL_CONFIG);
    journalsServiceApi.setRecords(RECORDS);

    const config = await journalsService.getJournalConfig(JOURNAL_CONFIG.id);

    expect(config.id).toEqual(JOURNAL_CONFIG.id);
    expect(config.columns.size).toEqual(JOURNAL_CONFIG.columns.size);

    const requiredProps = ['text', 'type', 'attribute', 'attSchema', 'default', 'searchable', 'sortable', 'visible', 'groupable', 'params'];

    let idx = 0;
    for (let column of config.columns) {
      expect(column.multiple).toBe(JOURNAL_CONFIG.columns[idx].multiple === true);
      expect(column.innerSchema && column.attSchema.indexOf('[]') !== -1).toBe(column.innerSchema && column.multiple);

      for (let prop of requiredProps) {
        let hasProp = column[prop] !== null && column[prop] !== undefined;
        if (!hasProp) {
          console.error('Prop is missing: ' + prop);
        }
        expect(hasProp).toBe(true);
      }

      idx++;
    }
  });

  it('Test computed attributes', async () => {
    journalsServiceApi.setConfig(JOURNAL_CONFIG);
    journalsServiceApi.setRecords(RECORDS);

    const config = await journalsService.getJournalConfig(JOURNAL_CONFIG.id);

    expect(config.computed[SCRIPT_COMPUTED_NAME]).toEqual(SCRIPT_COMPUTED_RES);
    expect(config.computed[QUERY_COMPUTED_NAME]).toEqual(
      RECORDS.map(r => {
        return { id: r.id, value: r[QUERY_COMPUTED_VALUE_ATTRIBUTE] };
      })
    );

    let attsComputedRec = RECORDS.find(r => r.id === ATTRIBUTES_COMPUTED_REC);
    let attsComputedRes = {};
    for (let key in ATTRIBUTES_COMPUTED_ATTS) {
      attsComputedRes[key] = attsComputedRec[ATTRIBUTES_COMPUTED_ATTS[key]];
    }
    expect(config.computed[ATTRIBUTES_COMPUTED_NAME]).toEqual(attsComputedRes);
  });
});
