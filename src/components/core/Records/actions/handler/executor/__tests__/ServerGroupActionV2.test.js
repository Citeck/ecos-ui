import Records from '@citeck/records-core';
import ServerGroupActionV2 from '../ServerGroupActionV2';

const TARGET_APP = 'emodel';
const STOP = 'stop after save';

let groupActionRec;
let getSpy;

beforeEach(() => {
  groupActionRec = {
    att: jest.fn(),
    save: jest.fn(() => Promise.reject(new Error(STOP)))
  };
  getSpy = jest.spyOn(Records, 'get').mockImplementation(() => groupActionRec);
});

afterEach(() => {
  getSpy.mockRestore();
});

const getSentValues = () => {
  const call = groupActionRec.att.mock.calls.find(([name]) => name === 'values');
  return call && call[1];
};

const execForQuery = async (query, valuesParams) => {
  const action = { config: { targetApp: TARGET_APP, valuesParams } };
  await expect(new ServerGroupActionV2().execForQuery(query, action)).rejects.toThrow(STOP);
  return action;
};

describe('ServerGroupActionV2 valuesParams', () => {
  it('nested config.pageSize is merged into values.config without losing the query', async () => {
    const query = { sourceId: 'emodel/type', query: { t: 'eq', a: '_type', v: 'x' } };

    await execForQuery(query, { limit: 20000, config: { pageSize: 1000 } });

    expect(getSpy).toHaveBeenCalledWith(TARGET_APP + '/group-action@');
    expect(getSentValues()).toEqual({
      type: 'records-query',
      limit: 20000,
      config: { query, pageSize: 1000 }
    });
  });

  it('keeps the records list for execForRecords', async () => {
    const action = { config: { targetApp: TARGET_APP, valuesParams: { config: { pageSize: 50 } } } };

    await expect(new ServerGroupActionV2().execForRecords([{ id: 'a' }, { id: 'b' }], action)).rejects.toThrow(STOP);

    expect(getSentValues()).toEqual({
      type: 'records-list',
      config: { records: ['a', 'b'], pageSize: 50 }
    });
  });

  it('does not mutate the action config', async () => {
    const valuesParams = { config: { pageSize: 1000 } };
    const action = await execForQuery({ sourceId: 'emodel/type' }, valuesParams);

    expect(action.config.valuesParams).toEqual({ config: { pageSize: 1000 } });
  });
});
