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

const VALUE_COMPUTED_NAME = 'value-computed';
const VALUE_COMPUTED_VALUE = 'value-computed-value';

const JOURNAL_CONFIG = {
  id: 'test-journal',
  computed: [
    {
      id: SCRIPT_COMPUTED_NAME,
      type: 'script',
      config: {
        script: 'return new Promise(resolve => setTimeout(() => { resolve("' + SCRIPT_COMPUTED_RES + '"); }, 100));'
      }
    },
    {
      id: QUERY_COMPUTED_NAME,
      type: 'query',
      config: {
        query: { query: 'test', language: 'predicate' },
        attributes: { value: QUERY_COMPUTED_VALUE_ATTRIBUTE }
      }
    },
    {
      id: ATTRIBUTES_COMPUTED_NAME,
      type: 'attributes',
      config: {
        record: ATTRIBUTES_COMPUTED_REC,
        attributes: ATTRIBUTES_COMPUTED_ATTS
      }
    },
    {
      id: VALUE_COMPUTED_NAME,
      type: 'value',
      config: {
        value: VALUE_COMPUTED_VALUE
      }
    }
  ],
  columns: [
    {
      name: 'Name1',
      label: 'Name 1 field',
      computed: [
        {
          id: 'test-computed',
          type: 'script',
          config: {
            vars: {
              key: 'prefix-${Name1}'
            },
            script: 'return vars.key;'
          }
        }
      ],
      formatter: {
        type: 'test',
        config: {
          url: 'http://host/v2/dashboard?recordRef=${$computed.test-computed}'
        }
      }
    },
    {
      name: 'Name2',
      multiple: true,
      label: 'Name 2 field',
      formatter: {
        type: 'test',
        config: {
          url: 'http://host/v2/dashboard?recordRef=${$computed.test-computed}'
        }
      }
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

    expect(config.configData.configComputed[SCRIPT_COMPUTED_NAME]).toEqual(SCRIPT_COMPUTED_RES);
    expect(config.configData.configComputed[QUERY_COMPUTED_NAME]).toEqual(
      RECORDS.map(r => {
        return { id: r.id, value: r[QUERY_COMPUTED_VALUE_ATTRIBUTE] };
      })
    );

    let attsComputedRec = RECORDS.find(r => r.id === ATTRIBUTES_COMPUTED_REC);
    let attsComputedRes = {};
    for (let key in ATTRIBUTES_COMPUTED_ATTS) {
      attsComputedRes[key] = attsComputedRec[ATTRIBUTES_COMPUTED_ATTS[key]];
    }
    expect(config.configData.configComputed[ATTRIBUTES_COMPUTED_NAME]).toEqual(attsComputedRes);

    expect(config.configData.configComputed[VALUE_COMPUTED_NAME]).toEqual(VALUE_COMPUTED_VALUE);
  });

  it('Test record computed attributes', async () => {
    journalsServiceApi.setConfig(JOURNAL_CONFIG);
    journalsServiceApi.setRecords(RECORDS);

    const config = await journalsService.getJournalConfig(JOURNAL_CONFIG.id);

    expect(config.columns[0].formatter.config.url).toBe('http://host/v2/dashboard?recordRef=${$computed.column_Name1.test-computed}');
    expect(config.columns[1].formatter.config.url).toBe('http://host/v2/dashboard?recordRef=${$computed.test-computed}');

    const journalData = await journalsService.getJournalData(config, {});

    expect(journalData.records.length).toEqual(RECORDS.length);
    expect(config.configData.configComputed[SCRIPT_COMPUTED_NAME] != null).toEqual(true);

    for (let idx = 0; idx < RECORDS.length; idx++) {
      expect(journalData.records[idx].rawAttributes['$computed.column_Name1.test-computed']).toEqual('prefix-' + RECORDS[idx].Name1);

      expect(journalData.records[idx].rawAttributes['$computed.' + SCRIPT_COMPUTED_NAME]).toEqual(
        config.configData.configComputed[SCRIPT_COMPUTED_NAME]
      );
    }
  });
});
