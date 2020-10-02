import { NotificationManager } from 'react-notifications';

import MenuSettingsService from '../../../../../../services/MenuSettingsService';
import Records from '../../../../Records';
import actionsRegistry from '../../../actionsRegistry';
import '../../../index';
import ViewAction from '../ViewAction';

const RecordIds = {
  MENU_0: 'uiserv/menu@test-menu-0',
  MENU_1: 'uiserv/menu@test-menu-1'
};

jest.spyOn(global, 'fetch').mockImplementation((url, request) => {
  const body = JSON.parse(request.body);

  switch (body.record) {
    case RecordIds.MENU_0:
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            id: RecordIds.MENU_0,
            attributes: {
              'version?str': '0'
            }
          })
      });
    case RecordIds.MENU_1:
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            id: RecordIds.MENU_1,
            attributes: {
              'version?str': '1'
            }
          })
      });
    default:
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            id: 'workspace://SpacesStore/a0652fbe-8b72-4a1c-9ca7-3d72c72a7f9e',
            attributes: {}
          })
      });
  }
});

describe('View Action', () => {
  const _safeError = NotificationManager.error;
  const _safeEmit = MenuSettingsService.emitter.emit;
  const action = actionsRegistry.getHandler(ViewAction.ACTION_ID);

  NotificationManager.error = () => undefined;

  it('case Menu version 0', async () => {
    NotificationManager.error = () => {
      expect(true).toBeTruthy();
    };

    const result = await action.execForRecord(Records.get(RecordIds.MENU_0), {});
    expect(result).toEqual(false);
  });

  it('case Menu version 1', async () => {
    MenuSettingsService.emitter.emit = (show, params, callback) => {
      expect(params.recordId).toEqual(RecordIds.MENU_1);
      expect(params.disabledEdit).toBeTruthy();
      expect(callback).toBeUndefined();
    };

    const result = await action.execForRecord(Records.get(RecordIds.MENU_1), {});
    expect(result).toEqual(false);
  });
  //todo others cases
  NotificationManager.error = _safeError;
  MenuSettingsService.emitter.emit = _safeEmit;
});
