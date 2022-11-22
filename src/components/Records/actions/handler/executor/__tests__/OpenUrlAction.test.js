import actionsRegistry from '../../../actionsRegistry';
import '../../../index';
import OpenUrlAction from '../OpenUrlAction';
import Records from '../../../../Records';
import PageService from '../../../../../../services/PageService';

const SIMPLE_RECORD_ID = 'workspace://SpacesStore/test-record';
const SIMPLE_ACTION_ID = 'open';

const execEvaluate = (config = {}) => {
  const action = actionsRegistry.getHandler(OpenUrlAction.ACTION_ID);

  return action.execForRecord(Records.get(SIMPLE_RECORD_ID), {
    id: SIMPLE_ACTION_ID,
    config: {
      ...config
    }
  });
};

let fetchSpy;
let spy;

beforeEach(() => {
  fetchSpy = jest.spyOn(global, 'fetch').mockImplementation((url, request) => {
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          records: JSON.parse(request.body).records.map(() => {
            return {
              id: SIMPLE_RECORD_ID,
              attributes: {}
            };
          })
        })
    });
  });
});

afterEach(() => {
  fetchSpy && fetchSpy.mockClear();
  spy && spy.mockClear();
});

describe('Open Url Action', () => {
  describe('Method execForRecord', () => {
    it('URL not passed', async () => {
      try {
        await execEvaluate();
      } catch (e) {
        expect(e.message).toEqual(`URL is a mandatory parameter! Record: ${SIMPLE_RECORD_ID} Action: ${SIMPLE_ACTION_ID}`);
      }
    });

    it('Adding Arguments to the URL', async () => {
      spy = jest.spyOn(window, 'open').mockImplementation(() => true);

      await execEvaluate({
        url: 'http://localhost:3000',
        args: {
          q1: true,
          q2: false,
          q3: 'userName'
        }
      });

      expect(spy.mock.calls[0][0]).toEqual('http://localhost:3000?q1=true&q2=false&q3=userName');
    });

    it('Open in Ecos Tab (new Ecos Tab by config attribute - openNewTab)', async () => {
      spy = jest.spyOn(PageService, 'changeUrlLink').mockImplementation(() => true);

      await execEvaluate({
        url: 'http://localhost:3000',
        withinEcosTab: true,
        openNewTab: true
      });

      expect(spy.mock.calls[0][0]).toEqual('http://localhost:3000');
      expect(spy.mock.calls[0][1]).toEqual({ openNewTab: true });
    });

    it('Open in Ecos Tab (new Ecos Tab by config attribute - target)', async () => {
      spy = jest.spyOn(PageService, 'changeUrlLink').mockImplementation(() => true);

      await execEvaluate({
        url: 'http://localhost:3000',
        withinEcosTab: true,
        target: '_blank'
      });

      expect(spy.mock.calls[0][0]).toEqual('http://localhost:3000');
      expect(spy.mock.calls[0][1]).toEqual({ openNewTab: true });
    });

    it('Open in Ecos Tab (self Ecos Tab by config attribute - target)', async () => {
      spy = jest.spyOn(PageService, 'changeUrlLink').mockImplementation(() => true);

      await execEvaluate({
        url: 'http://localhost:3000',
        withinEcosTab: true,
        target: '_self'
      });

      expect(spy.mock.calls[0][0]).toEqual('http://localhost:3000');
      expect(spy.mock.calls[0][1]).toEqual({ openNewTab: false });
    });

    it('Open in Ecos Tab (new Ecos Tab by default)', async () => {
      spy = jest.spyOn(PageService, 'changeUrlLink').mockImplementation(() => true);

      await execEvaluate({
        url: 'http://localhost:3000',
        withinEcosTab: true
      });

      expect(spy.mock.calls[0][0]).toEqual('http://localhost:3000');
      expect(spy.mock.calls[0][1]).toEqual({ openNewTab: true });
    });
  });
});
