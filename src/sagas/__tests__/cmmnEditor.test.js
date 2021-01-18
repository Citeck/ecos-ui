import { runSaga } from 'redux-saga';
import { fetchScenario, fetchTitle, init, runSaveScenario } from '../cmmnEditor';
import { setScenario, setTitle } from '../../actions/cmmnEditor';
import api from '../../__mocks__/api.mock';

const logger = { error: jest.fn() };

afterEach(() => {
  jest.clearAllMocks();
});

describe('CMMN Editor sagas tests', () => {
  it('init CMMN', async () => {
    const dispatched = [];

    await runSaga(
      {
        dispatch: action => dispatched.push(action)
      },
      init,
      { logger },
      { payload: { stateId: 'stateId', record: 'record' } }
    ).done;

    expect(dispatched.length).toEqual(2);
  });

  it('fetchScenario saga', async () => {
    const dispatched = [];

    await runSaga(
      {
        dispatch: action => dispatched.push(action)
      },
      fetchScenario,
      { api: api.happy, logger },
      { payload: { stateId: 'stateId', record: 'record' } }
    ).done;

    expect(dispatched.length).toEqual(1);
    expect(dispatched[0].type).toEqual(setScenario().type);
    expect(dispatched[0].payload.scenario).toEqual('xml');
  });

  it('fetchTitle saga', async () => {
    const dispatched = [];

    await runSaga(
      {
        dispatch: action => dispatched.push(action)
      },
      fetchTitle,
      { api: api.happy, logger },
      { payload: { stateId: 'stateId', record: 'record' } }
    ).done;

    expect(dispatched.length).toEqual(1);
    expect(dispatched[0].type).toEqual(setTitle().type);
    expect(dispatched[0].payload.title).toEqual('title');
  });

  describe('runSaveScenario saga', () => {
    it('Good - there is all data', async () => {
      const dispatched = [];

      await runSaga(
        {
          dispatch: action => dispatched.push(action)
        },
        runSaveScenario,
        { api: api.happy, logger },
        { payload: { stateId: 'stateId', record: 'record', xml: 'xml', img: 'svg' } }
      ).done;

      expect(dispatched.length).toEqual(1);
      expect(dispatched[0].type).toEqual(setScenario().type);
      expect(dispatched[0].payload.scenario).toEqual('xml');
    });

    it('Bad - there is no special data', async () => {
      const dispatched = [];

      await runSaga(
        {
          dispatch: action => dispatched.push(action)
        },
        runSaveScenario,
        { api: api.happy, logger },
        { payload: { stateId: 'stateId', record: 'record' } }
      ).done;

      expect(dispatched.length).toEqual(0);
    });
  });
});
