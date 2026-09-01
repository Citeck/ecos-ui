import { runSaga } from 'redux-saga';

import { setModel, setNewData } from '../../actions/processStatistics';
import { sagaGetModel } from '../processStatistics';

const stateId = 'test-state-id';
const record = 'eproc/bpmn-def@test-process';

const runGetModel = async api => {
  const dispatched = [];

  await runSaga(
    {
      dispatch: action => dispatched.push(action),
      getState: () => ({ processStatistics: { [stateId]: { filters: [] } } })
    },
    sagaGetModel,
    { api },
    { payload: { record, stateId } }
  );

  return dispatched;
};

describe('processStatistics sagaGetModel', () => {
  beforeAll(() => {
    window.Citeck = window.Citeck || {};
  });

  it('dispatches the model before statistics are loaded, then statistics separately', async () => {
    let modelShownBeforeStats = false;

    const api = {
      process: {
        getModel: jest.fn().mockResolvedValue('<xml/>'),
        getHeatmapData: jest.fn().mockImplementation(async () => {
          return [{ id: 'a', activeCount: 1 }];
        }),
        getKPIData: jest.fn().mockResolvedValue([])
      }
    };

    const dispatched = await runGetModel(api);

    const setModelActions = dispatched.filter(a => a.type === setModel({}).type);

    expect(setModelActions).toHaveLength(2);

    expect(setModelActions[0].payload).toEqual({ stateId, model: '<xml/>' });
    expect(setModelActions[0].payload).not.toHaveProperty('heatmapData');

    expect(setModelActions[1].payload).toMatchObject({ stateId, heatmapData: [{ id: 'a', activeCount: 1 }], KPIData: [] });
    expect(setModelActions[1].payload).not.toHaveProperty('model');

    const newDataActions = dispatched.filter(a => a.type === setNewData({}).type);
    expect(newDataActions).toHaveLength(1);
    expect(newDataActions[0].payload).toEqual({ stateId, isNewData: true });

    modelShownBeforeStats = dispatched.indexOf(setModelActions[0]) < dispatched.indexOf(setModelActions[1]);
    expect(modelShownBeforeStats).toBe(true);
  });

  it('loads heatmap and KPI in parallel', async () => {
    const started = [];
    const makeSlow = (name, value) =>
      jest.fn().mockImplementation(() => {
        started.push(name);
        return new Promise(resolve => setTimeout(() => resolve(value), 10));
      });

    const api = {
      process: {
        getModel: jest.fn().mockResolvedValue('<xml/>'),
        getHeatmapData: makeSlow('heatmap', []),
        getKPIData: makeSlow('kpi', [])
      }
    };

    await runGetModel(api);

    expect(started).toEqual(['heatmap', 'kpi']);
  });

  it('keeps the model when statistics loading fails', async () => {
    const api = {
      process: {
        getModel: jest.fn().mockResolvedValue('<xml/>'),
        getHeatmapData: jest.fn().mockRejectedValue(new Error('gateway timeout')),
        getKPIData: jest.fn().mockResolvedValue([])
      }
    };

    const dispatched = await runGetModel(api);

    const setModelActions = dispatched.filter(a => a.type === setModel({}).type);

    expect(setModelActions[0].payload).toEqual({ stateId, model: '<xml/>' });

    const last = setModelActions[setModelActions.length - 1];
    expect(last.payload).toMatchObject({ stateId, heatmapData: [] });
    expect(last.payload).not.toHaveProperty('model');
  });

  it('resets everything when the model itself fails to load', async () => {
    const api = {
      process: {
        getModel: jest.fn().mockRejectedValue(new Error('no definition')),
        getHeatmapData: jest.fn(),
        getKPIData: jest.fn()
      }
    };

    const dispatched = await runGetModel(api);

    const setModelActions = dispatched.filter(a => a.type === setModel({}).type);

    expect(setModelActions).toHaveLength(1);
    expect(setModelActions[0].payload).toEqual({ stateId, model: null, heatmapData: [], KPIData: [] });
    expect(api.process.getHeatmapData).not.toHaveBeenCalled();
  });
});
