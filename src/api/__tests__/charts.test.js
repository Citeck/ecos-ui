import Records from '../../components/Records/Records';
import { ChartsApi } from '../charts';

jest.mock('../../components/Records/Records', () => {
  const mock = {
    get: jest.fn().mockReturnValue({
      load: jest.fn().mockResolvedValue(null)
    }),
    query: jest.fn().mockResolvedValue({ records: [] })
  };
  return {
    __esModule: true,
    default: mock
  };
});

jest.mock('../../components/Filters/predicates', () => ({
  ParserPredicate: {
    replacePredicatesType: jest.fn(val => val),
    removeEmptyPredicates: jest.fn(val => val)
  }
}));

jest.mock('../../dto/journals', () => ({
  __esModule: true,
  default: {
    cleanUpPredicate: jest.fn(val => val)
  }
}));

jest.mock('../../services/AttributesService', () => ({
  __esModule: true,
  default: {
    parseId: jest.fn(ref => ref.split('@').pop() || ref)
  }
}));

const originalCiteck = global.Citeck;

beforeAll(() => {
  global.Citeck = {
    Navigator: {
      getWorkspaceId: jest.fn().mockReturnValue('default')
    }
  };
});

afterAll(() => {
  global.Citeck = originalCiteck;
});

describe('ChartsApi', () => {
  let api;

  beforeEach(() => {
    api = new ChartsApi();
    jest.clearAllMocks();

    Records.get.mockReturnValue({
      load: jest.fn().mockResolvedValue(null)
    });
    Records.query.mockResolvedValue({ records: [] });
  });

  const typeRef = 'emodel/type@test-type';
  const groupByParams = [{ attribute: 'status', isDateColumn: false, dateParam: null, dateRange: null }];
  const aggregationParam = 'count(*)';
  const selectedPreset = 'default';

  it('should include journalPredicate in query when provided', async () => {
    const journalPredicate = { t: 'eq', att: '_status', val: 'active' };

    await api.getChartData(typeRef, groupByParams, aggregationParam, selectedPreset, journalPredicate);

    const queryCall = Records.query.mock.calls[0];
    const query = queryCall[0].query;

    expect(query.t).toBe('and');
    expect(query.val).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ t: 'eq', att: '_type', val: typeRef }),
        expect.objectContaining({ t: 'eq', att: '_status', val: 'active' })
      ])
    );
  });

  it('should NOT include journalPredicate when null', async () => {
    await api.getChartData(typeRef, groupByParams, aggregationParam, selectedPreset, null);

    const queryCall = Records.query.mock.calls[0];
    const query = queryCall[0].query;

    expect(query).toEqual({ t: 'eq', att: '_type', val: typeRef });
  });

  it('should NOT include journalPredicate when undefined', async () => {
    await api.getChartData(typeRef, groupByParams, aggregationParam, selectedPreset, undefined);

    const queryCall = Records.query.mock.calls[0];
    const query = queryCall[0].query;

    expect(query).toEqual({ t: 'eq', att: '_type', val: typeRef });
  });

  it('should NOT include journalPredicate when empty object', async () => {
    await api.getChartData(typeRef, groupByParams, aggregationParam, selectedPreset, {});

    const queryCall = Records.query.mock.calls[0];
    const query = queryCall[0].query;

    expect(query).toEqual({ t: 'eq', att: '_type', val: typeRef });
  });

  it('should include both preset predicate and journal predicate when both are present', async () => {
    const presetPredicate = { t: 'eq', att: 'priority', val: 'high' };
    Records.get.mockReturnValue({
      load: jest.fn().mockResolvedValue(presetPredicate)
    });

    const journalPredicate = { t: 'eq', att: '_status', val: 'active' };

    await api.getChartData(typeRef, groupByParams, aggregationParam, selectedPreset, journalPredicate);

    const queryCall = Records.query.mock.calls[0];
    const query = queryCall[0].query;

    expect(query.t).toBe('and');
    expect(query.val.length).toBe(3);
    expect(query.val).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ att: '_type' }),
        expect.objectContaining({ att: 'priority' }),
        expect.objectContaining({ att: '_status' })
      ])
    );
  });

  it('bug reproduction: selectedPreset=default with journalPredicate should include journal predicate', async () => {
    Records.get.mockReturnValue({
      load: jest.fn().mockResolvedValue(null)
    });

    const journalPredicate = {
      t: 'or',
      val: [
        { t: 'not-eq', att: '_status', val: 'draft' },
        { t: 'eq', att: '_status', val: 'draft' }
      ]
    };

    await api.getChartData(typeRef, groupByParams, aggregationParam, 'default', journalPredicate);

    const queryCall = Records.query.mock.calls[0];
    const query = queryCall[0].query;

    expect(query.t).toBe('and');
    expect(query.val).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ att: '_type' }),
        expect.objectContaining({ t: 'or' })
      ])
    );
  });
});
