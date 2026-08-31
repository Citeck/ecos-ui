import Records from '@citeck/records-core';

import { ProcessApi } from '../process';

jest.mock('@citeck/records-core', () => {
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

jest.mock('../../helpers/ecosFetch', () => ({
  __esModule: true,
  default: jest.fn()
}));

const PROC_DEF = 'eproc/bpmn-def@test-process';

describe('ProcessApi.getHeatmapData', () => {
  let api;

  beforeEach(() => {
    api = new ProcessApi();
    Records.query.mockClear();
    Records.query.mockResolvedValue({ records: [] });
  });

  it('makes exactly one query per completed/active side without pagination loop', async () => {
    const fullPage = Array.from({ length: 100 }, (_, i) => ({ id: `el-${i}`, completedCount: 1 }));
    Records.query.mockResolvedValue({ records: fullPage });

    await api.getHeatmapData(PROC_DEF);

    expect(Records.query).toHaveBeenCalledTimes(2);

    Records.query.mock.calls.forEach(([query]) => {
      expect(query.page.maxItems).toBeGreaterThanOrEqual(10000);
      expect(query.groupBy).toEqual(['elementDefId']);
    });
  });

  it('merges completed and active counts by element id', async () => {
    Records.query.mockImplementation(query => {
      const isCompleted = query.query.v.some(p => p.a === 'completed' && p.t === 'not-empty');

      if (isCompleted) {
        return Promise.resolve({ records: [{ id: 'a', completedCount: 2 }] });
      }

      return Promise.resolve({
        records: [
          { id: 'a', activeCount: 3 },
          { id: 'b', activeCount: 1 }
        ]
      });
    });

    const result = await api.getHeatmapData(PROC_DEF);

    expect(result).toEqual([
      { id: 'a', completedCount: 2, activeCount: 3 },
      { id: 'b', activeCount: 1 }
    ]);
  });

  it('deduplicates concurrent identical requests', async () => {
    const resolvers = [];
    Records.query.mockImplementation(
      () =>
        new Promise(resolve => {
          resolvers.push(resolve);
        })
    );

    const first = api.getHeatmapData(PROC_DEF);
    const second = api.getHeatmapData(PROC_DEF);

    expect(Records.query).toHaveBeenCalledTimes(2);
    expect(second).toBe(first);

    resolvers.forEach(resolve => resolve({ records: [] }));
    await Promise.all([first, second]);
  });

  it('does not deduplicate requests with different predicates', async () => {
    Records.query.mockResolvedValue({ records: [] });

    await Promise.all([api.getHeatmapData(PROC_DEF), api.getHeatmapData(PROC_DEF, [{ t: 'eq', att: 'x', val: 1 }])]);

    expect(Records.query).toHaveBeenCalledTimes(4);
  });

  it('sends a fresh request after the previous one settles', async () => {
    Records.query.mockResolvedValue({ records: [] });

    await api.getHeatmapData(PROC_DEF);
    await api.getHeatmapData(PROC_DEF);

    expect(Records.query).toHaveBeenCalledTimes(4);
  });

  it('clears the in-flight cache when the request fails', async () => {
    Records.query.mockRejectedValue(new Error('gateway timeout'));

    await expect(api.getHeatmapData(PROC_DEF)).rejects.toThrow();

    Records.query.mockResolvedValue({ records: [] });

    await expect(api.getHeatmapData(PROC_DEF)).resolves.toEqual([]);
  });
});
