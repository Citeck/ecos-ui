import actionsRegistry from '../../../actionsRegistry';
import Records from '../../../../Records';
import '../../../index';
import DeleteAction from '../DeleteAction';
import DialogManager from '../../../../../common/dialogs/Manager/DialogManager';

const SIMPLE_RECORD_ID = 'workspace://SpacesStore/test-record';

jest.spyOn(global, 'fetch').mockImplementation((_url, request) => {
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

const execEvaluate = (config = {}, context = {}, isArray = false) => {
  const action = actionsRegistry.getHandler(DeleteAction.ACTION_ID);

  return action[isArray ? 'execForRecords' : 'execForRecord'](
    isArray ? [Records.get(SIMPLE_RECORD_ID)] : Records.get(SIMPLE_RECORD_ID),
    { config: { ...config } },
    context
  );
};

let spy;

afterEach(() => {
  spy && spy.mockClear();
});

describe('Delete Action', () => {
  describe('method execForRecord', () => {
    it('Without confirmation (success)', async () => {
      const result = await execEvaluate({ withoutConfirm: true });

      expect(result).toEqual(true);
    });

    it('Without confirmation (error)', async () => {
      const ERROR_MESSAGE = 'Remove Failed';

      spy = jest.spyOn(Records, 'remove').mockImplementationOnce(() => {
        throw new Error(ERROR_MESSAGE);
      });

      try {
        const result = await execEvaluate({ withoutConfirm: true });

        expect(result).toEqual(true);
      } catch (e) {
        expect(e.message).toEqual(ERROR_MESSAGE);
      }
    });

    it('With confirmation (success)', async () => {
      spy = jest.spyOn(DialogManager, 'showRemoveDialog').mockImplementation(config => {
        return Promise.resolve(config.onDelete());
      });

      const result = await execEvaluate();

      expect(spy.mock.calls.length).toBe(1);
      expect(result).toBe(true);
    });

    it('With confirmation (error)', async () => {
      spy = jest.spyOn(DialogManager, 'showRemoveDialog').mockImplementation(config => {
        return Promise.resolve(config.onCancel());
      });

      const result = await execEvaluate();

      expect(spy.mock.calls.length).toBe(1);
      expect(result).toBe(false);
    });
  });

  describe('method getDefaultActionModel', () => {
    it('Default action model config', async () => {
      const action = actionsRegistry.getHandler(DeleteAction.ACTION_ID);

      expect(action.getDefaultActionModel()).toEqual({
        name: 'record-action.name.delete',
        icon: 'icon-delete',
        theme: 'danger'
      });
    });
  });

  describe('method execForRecords', () => {
    it('Without confirmation (success)', async () => {
      const result = await execEvaluate({ withoutConfirm: true }, {}, true);

      expect(result).toEqual(true);
    });

    it('Without confirmation (error)', async () => {
      const ERROR_MESSAGE = 'Remove Failed';

      spy = jest.spyOn(Records, 'remove').mockImplementationOnce(() => {
        throw new Error(ERROR_MESSAGE);
      });

      try {
        const result = await execEvaluate({ withoutConfirm: true }, {}, true);

        expect(result).toEqual(true);
      } catch (e) {
        expect(e.message).toEqual(ERROR_MESSAGE);
      }
    });

    it('With confirmation (success)', async () => {
      spy = jest.spyOn(DialogManager, 'showRemoveDialog').mockImplementation(config => {
        return Promise.resolve(config.onDelete());
      });

      const result = await execEvaluate({}, {}, true);

      expect(spy.mock.calls.length).toBe(1);
      expect(result).toBe(true);
    });

    it('With confirmation (error)', async () => {
      spy = jest.spyOn(DialogManager, 'showRemoveDialog').mockImplementation(config => {
        return Promise.resolve(config.onCancel());
      });

      const result = await execEvaluate({}, {}, true);

      expect(spy.mock.calls.length).toBe(1);
      expect(result).toBe(false);
    });
  });
});
