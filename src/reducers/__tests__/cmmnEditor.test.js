import reducer from '../cmmnEditor';
import * as Actions from '../../actions/cmmnEditor';

const stateId = 'stateId';
const initialState = reducer(undefined, Actions.initData({ stateId }));

describe('cmmnEditor reducer tests', () => {
  it(`should handle "initData"`, () => {
    const newState = reducer(undefined, Actions.initData({ stateId }));
    const ownState = newState[stateId];
    expect(newState.hasOwnProperty(stateId)).toEqual(true);
    expect(ownState.title).toBeUndefined();
    expect(ownState.scenario).toBeUndefined();
    expect(ownState.isLoading).toBeTruthy();
  });

  it(`should handle "setTitle"`, () => {
    const newState = reducer(initialState, Actions.setTitle({ stateId, title: 'test' }));
    const ownState = newState[stateId];
    expect(ownState.title).toEqual('test');
  });

  it(`should handle "getScenario"`, () => {
    const newState = reducer(initialState, Actions.getScenario({ stateId }));
    const ownState = newState[stateId];
    expect(ownState.scenario).toBeUndefined();
    expect(ownState.isLoading).toBeTruthy();
  });

  it(`should handle "setScenario"`, () => {
    const newState = reducer(initialState, Actions.setScenario({ stateId, scenario: 'xml' }));
    const ownState = newState[stateId];
    expect(ownState.scenario).toEqual('xml');
    expect(ownState.isLoading).toBeFalsy();
  });

  it(`should handle "getFormProps"`, () => {
    const newState = reducer(initialState, Actions.getFormProps({ stateId }));
    const ownState = newState[stateId];
    expect(ownState.formProps).toEqual({});
  });

  it(`should handle "setFormProps"`, () => {
    const newState = reducer(initialState, Actions.setFormProps({ stateId, formProps: { test: '' } }));
    const ownState = newState[stateId];
    expect(ownState.formProps).toEqual({ test: '' });
  });

  it(`should handle "setFormData"`, () => {
    const newState = reducer(initialState, Actions.setFormData({ stateId, formData: { test: '' } }));
    const ownState = newState[stateId];
    expect(ownState.formProps.formData).toEqual({ test: '' });
  });

  it(`should handle "setLoading"`, () => {
    const newState1 = reducer(initialState, Actions.setLoading({ stateId, isLoading: true }));
    const ownState = newState1[stateId];
    expect(ownState.isLoading).toBeTruthy();

    const newState2 = reducer(initialState, Actions.setLoading({ stateId, isLoading: false }));
    const ownState2 = newState2[stateId];
    expect(ownState2.isLoading).toBeFalsy();
  });
});
