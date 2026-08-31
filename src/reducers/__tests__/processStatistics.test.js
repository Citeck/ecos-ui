import { filterHeatdata, getModel, setModel } from '../../actions/processStatistics';
import reducer from '../processStatistics';

const stateId = 'test-state-id';

describe('processStatistics reducer — heatmap loading flags', () => {
  it('getModel starts loading both the model and the heatmap', () => {
    const state = reducer({}, getModel({ stateId }));

    expect(state[stateId].isLoadingModel).toBe(true);
    expect(state[stateId].isLoadingHeatmap).toBe(true);
  });

  it('partial setModel with model only finishes model loading, heatmap keeps loading', () => {
    let state = reducer({}, getModel({ stateId }));

    state = reducer(state, setModel({ stateId, model: '<xml/>' }));

    expect(state[stateId].model).toBe('<xml/>');
    expect(state[stateId].isLoadingModel).toBe(false);
    expect(state[stateId].isLoadingHeatmap).toBe(true);
  });

  it('setModel with heatmapData finishes heatmap loading and keeps the model', () => {
    let state = reducer({}, getModel({ stateId }));

    state = reducer(state, setModel({ stateId, model: '<xml/>' }));
    state = reducer(state, setModel({ stateId, heatmapData: [{ id: 'a' }], KPIData: [] }));

    expect(state[stateId].model).toBe('<xml/>');
    expect(state[stateId].heatmapData).toEqual([{ id: 'a' }]);
    expect(state[stateId].isLoadingHeatmap).toBe(false);
    expect(state[stateId].isLoadingModel).toBe(false);
  });

  it('filterHeatdata restarts heatmap loading without hiding the model', () => {
    let state = reducer({}, getModel({ stateId }));

    state = reducer(state, setModel({ stateId, model: '<xml/>' }));
    state = reducer(state, setModel({ stateId, heatmapData: [], KPIData: [] }));
    state = reducer(state, filterHeatdata({ stateId }));

    expect(state[stateId].isLoadingHeatmap).toBe(true);
    expect(state[stateId].isLoadingModel).toBe(false);
    expect(state[stateId].model).toBe('<xml/>');
  });
});
