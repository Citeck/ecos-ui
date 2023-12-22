import reducer from '../journals';
import { setForceUpdate } from '../../actions/journals';
import { wrapArgs } from '../../helpers/redux';

const stateId = 'stateId';

describe('journals reducer tests', () => {
  it('setForceUpdate', () => {
    const w = wrapArgs(stateId);

    const newState = reducer(undefined, setForceUpdate(w(true)));
    const ownState = newState[stateId];

    expect(ownState.forceUpdate).toEqual(true);
  });
});
