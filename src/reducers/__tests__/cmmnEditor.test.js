import reducer from '../cmmnEditor';
import { getScenario, initData, setScenario, setTitle } from '../../actions/cmmnEditor';

const stateId = 'stateId';
const initialState = reducer(undefined, initData({ stateId }));

describe('cmmnEditor reducer tests', () => {
  it(`should handle "initData"`, () => {
    const newState = reducer(undefined, initData({ stateId }));
    const ownState = newState[stateId];
    expect(newState.hasOwnProperty(stateId)).toEqual(true);
    expect(ownState.title).toBeUndefined();
    expect(ownState.scenario).toBeUndefined();
    expect(ownState.isLoading).toBeTruthy();
  });

  it(`should handle "setTitle"`, () => {
    const newState = reducer(initialState, setTitle({ stateId, title: 'test' }));
    const ownState = newState[stateId];
    expect(ownState.title).toEqual('test');
  });

  it(`should handle "getScenario"`, () => {
    const newState = reducer(initialState, getScenario({ stateId }));
    const ownState = newState[stateId];
    expect(ownState.scenario).toBeUndefined();
    expect(ownState.isLoading).toBeTruthy();
  });

  it(`should handle "setScenario"`, () => {
    const newState = reducer(initialState, setScenario({ stateId, scenario: 'xml' }));
    const ownState = newState[stateId];
    expect(ownState.scenario).toEqual('xml');
    expect(ownState.isLoading).toBeFalsy();
  });
});
