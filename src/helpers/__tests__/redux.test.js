import * as ReduxUtils from '../redux';
import * as StoreUtils from '../store';

describe('Redux helpers', () => {
  describe('fun handleAction', () => {
    it("there's _args", () => {
      const action = { payload: { _args: { t: 0 } } };
      ReduxUtils.handleAction(action);

      expect(action.payload).toEqual({ t: 0 });
    });

    it("there isn't _args", () => {
      const action = { payload: { other: {} } };
      ReduxUtils.handleAction(action);

      expect(action.payload).toEqual({ other: {} });
    });
  });

  describe('fun getStateId', () => {
    it("there's full data", () => {
      const id = StoreUtils.getStateId({ tabId: 0, id: 1 });
      expect(id).toEqual('[0]-[1]');
    });

    it("there isn't full data", () => {
      const id = StoreUtils.getStateId({});
      expect(id).toEqual('[]-[]');
    });
  });

  describe('fun getCurrentStateById', () => {
    const state = {
      123: { a: 123 },
      456: { a: 456 }
    };

    it('state by id', () => {
      const _state = ReduxUtils.getCurrentStateById(state, 123, {});
      expect(_state).toEqual(state[123]);
    });

    it('state by id with initial', () => {
      const init = { b: 122 };
      const _state = ReduxUtils.getCurrentStateById(state, 456, init);
      expect(_state).toEqual({ ...state[456], ...init });
    });
  });

  describe('fun deleteStateById', () => {
    const state = {
      123: { t: 123 },
      456: { t: 456 }
    };

    it('del existent', () => {
      const keysBefore = Object.keys(state).length;
      const _state = ReduxUtils.deleteStateById(state, 123);
      const keysAfter = Object.keys(_state).length;
      expect(_state[123]).toBeUndefined();
      expect(keysAfter).toEqual(keysBefore - 1);
    });

    it('del nonexistent', () => {
      const keysBefore = Object.keys(state).length;
      const _state = ReduxUtils.deleteStateById(state, 99999999999);
      const keysAfter = Object.keys(_state).length;
      expect(state).toEqual(_state);
      expect(keysBefore).toEqual(keysAfter);
    });
  });

  describe('fun startLoading', () => {
    const state = {
      123: { t: 123 },
      456: { t: 456, isLoading: false }
    };

    it('isLoading=undefined', () => {
      expect(state[123].isLoading).toBeUndefined();
      const _state = ReduxUtils.startLoading()(state, { payload: { stateId: 123 } });
      expect(_state[123].isLoading).toBe(true);
    });

    it('isLoading=false', () => {
      expect(state[456].isLoading).toBe(false);
      const _state = ReduxUtils.startLoading()(state, { payload: { stateId: 456 } });
      expect(_state[456].isLoading).toBe(true);
    });
  });

  describe('fun updateState', () => {
    const state = {
      123: { a: 123 }
    };

    it('isLoading=undefined', () => {
      expect(state[123]).toEqual({ a: 123 });
      const _state = ReduxUtils.updateState(state, 123, { b: 456 });
      expect(_state[123]).toEqual({ a: 123, b: 456 });
    });
  });
});
