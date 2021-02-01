import { runSaga } from 'redux-saga';
import { NotificationManager } from 'react-notifications';

import { setFormProps, setScenario, setTitle } from '../../actions/cmmnEditor';
import { deleteTab } from '../../actions/pageTabs';
import EcosFormUtils from '../../components/EcosForm/EcosFormUtils';
import { fetchFormProps, fetchScenario, fetchTitle, init, runSaveScenario } from '../cmmnEditor';

const api = {
  app: {
    getBase64: () => 'base64'
  },
  page: {
    getRecordTitle: () => 'title'
  },
  cmmn: {
    getDefinition: () => 'xml',
    saveDefinition: () => ({ id: 'id' })
  }
};

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
      { api, logger },
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
      { api, logger },
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
        { api, logger },
        { payload: { stateId: 'stateId', record: 'record', xml: 'xml', img: 'svg' } }
      ).done;

      expect(dispatched.length).toEqual(1);
      expect(dispatched[0].type).toEqual(deleteTab().type);
    });

    it('Bad - there is no special data', async () => {
      const dispatched = [];

      await runSaga(
        {
          dispatch: action => dispatched.push(action)
        },
        runSaveScenario,
        { api, logger },
        { payload: { stateId: 'stateId', record: 'record' } }
      ).done;

      expect(dispatched.length).toEqual(0);
    });
  });

  describe('fetchFormProps saga', () => {
    it('Good - there is all data', async () => {
      const dispatched = [];
      const spyError = jest.spyOn(NotificationManager, 'error').mockResolvedValue(null);
      const spyGetFormById = jest.spyOn(EcosFormUtils, 'getFormById').mockResolvedValue({ formDefinition: {}, formI18n: {} });

      await runSaga(
        {
          dispatch: action => dispatched.push(action)
        },
        fetchFormProps,
        { api, logger },
        { payload: { formId: 'formId' } }
      ).done;
      expect(spyGetFormById).toHaveBeenCalledTimes(1);
      expect(spyError).toHaveBeenCalledTimes(0);
      expect(dispatched.length).toEqual(1);
      expect(dispatched[0].type).toEqual(setFormProps().type);
      expect(dispatched[0].payload.formProps).toEqual({ formData: {}, formDefinition: {}, formI18n: {} });
    });

    it('Bad - there is no formId', async () => {
      const dispatched = [];
      const spyError = jest.spyOn(NotificationManager, 'error').mockResolvedValue(null);
      const spyGetFormById = jest.spyOn(EcosFormUtils, 'getFormById').mockResolvedValue({});

      await runSaga(
        {
          dispatch: action => dispatched.push(action)
        },
        fetchFormProps,
        { api, logger },
        { payload: {} }
      ).done;

      expect(spyGetFormById).toHaveBeenCalledTimes(0);
      expect(spyError).toHaveBeenCalledTimes(1);
      expect(dispatched.length).toEqual(1);
      expect(dispatched[0].type).toEqual(setFormProps().type);
      expect(dispatched[0].payload.formProps).toEqual({});
    });

    it('Bad - there is no formDefinition', async () => {
      const dispatched = [];
      const spyError = jest.spyOn(NotificationManager, 'error').mockResolvedValue(null);
      const spyGetFormById = jest.spyOn(EcosFormUtils, 'getFormById').mockResolvedValue({});

      await runSaga(
        {
          dispatch: action => dispatched.push(action)
        },
        fetchFormProps,
        { api, logger },
        { payload: { formId: 'formId' } }
      ).done;

      expect(spyGetFormById).toHaveBeenCalledTimes(1);
      expect(spyError).toHaveBeenCalledTimes(1);
      expect(dispatched.length).toEqual(1);
      expect(dispatched[0].type).toEqual(setFormProps().type);
      expect(dispatched[0].payload.formProps).toEqual({});
    });
  });
});
