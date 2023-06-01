import actionsRegistry from '../../../actionsRegistry';
import '../../../index';
import EditMenuAction from '../EditMenuAction';
import MenuSettingsService from '../../../../../../services/MenuSettingsService';
import Records from '../../../../Records';

const SIMPLE_RECORD_ID = 'workspace://SpacesStore/test-record';

const execEvaluate = () => {
  actionsRegistry.register(new EditMenuAction());
  const action = actionsRegistry.getHandler(EditMenuAction.ACTION_ID);

  return action.execForRecord(Records.get(SIMPLE_RECORD_ID));
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

describe('Edit Menu Action', () => {
  describe('Method execForRecord', () => {
    it('Show menu settings (success)', async () => {
      spy = jest.spyOn(MenuSettingsService.emitter, 'emit').mockImplementation((event, values, callback) => {
        return callback(true);
      });

      const result = await execEvaluate();

      expect(result).toEqual(true);
    });

    it('Show menu settings (failed)', async () => {
      spy = jest.spyOn(MenuSettingsService.emitter, 'emit').mockImplementation((event, values, callback) => {
        callback(false);
        return false;
      });

      const result = await execEvaluate();

      expect(result).toEqual(false);
    });
  });
});
