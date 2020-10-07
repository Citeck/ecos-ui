import { NotificationManager } from 'react-notifications';

import MenuSettingsService from '../../../../../../services/MenuSettingsService';
import Records from '../../../../Records';
import actionsRegistry from '../../../actionsRegistry';
import '../../../index';
import ViewMenuAction from '../ViewMenuAction';
import EditMenuAction from '../EditMenuAction';

const RecordIds = {
  MENU_1: 'uiserv/menu@test-menu-1'
};

describe('Menu Actions', () => {
  const _safeError = NotificationManager.error;
  const _safeEmit = MenuSettingsService.emitter.emit;

  NotificationManager.error = () => undefined;

  it('View', async () => {
    const action = actionsRegistry.getHandler(ViewMenuAction.ACTION_ID);

    MenuSettingsService.emitter.emit = (show, params, callback) => {
      expect(params.recordId).toEqual(RecordIds.MENU_1);
      expect(params.disabledEdit).toBeTruthy();
      expect(callback).toBeUndefined();
    };

    const result = await action.execForRecord(Records.get(RecordIds.MENU_1), {});
    expect(result).toEqual(true);
  });

  it('Edit', async () => {
    const action = actionsRegistry.getHandler(EditMenuAction.ACTION_ID);

    MenuSettingsService.emitter.emit = (show, params, callback) => {
      expect(params.recordId).toEqual(RecordIds.MENU_1);
      expect(params.disabledEdit).toBeFalsy();
      expect(typeof callback).toEqual('function');
      callback(true);
    };

    const result = await action.execForRecord(Records.get(RecordIds.MENU_1), {});
    expect(result).toEqual(true);
  });

  NotificationManager.error = _safeError;
  MenuSettingsService.emitter.emit = _safeEmit;
});
