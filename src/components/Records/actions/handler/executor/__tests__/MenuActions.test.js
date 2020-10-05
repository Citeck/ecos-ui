import { NotificationManager } from 'react-notifications';

import MenuSettingsService from '../../../../../../services/MenuSettingsService';
import Records from '../../../../Records';
import actionsRegistry from '../../../actionsRegistry';
import '../../../index';
import ViewMenuAction from '../ViewMenuAction';

const RecordIds = {
  MENU_1: 'uiserv/menu@test-menu-1'
};

describe('Menu Actions', () => {
  const _safeError = NotificationManager.error;
  const _safeEmit = MenuSettingsService.emitter.emit;
  const action = actionsRegistry.getHandler(ViewMenuAction.ACTION_ID);

  NotificationManager.error = () => undefined;

  it('View', async () => {
    MenuSettingsService.emitter.emit = (show, params, callback) => {
      expect(params.recordId).toEqual(RecordIds.MENU_1);
      expect(params.disabledEdit).toBeTruthy();
      expect(callback).toBeUndefined();
    };

    const result = await action.execForRecord(Records.get(RecordIds.MENU_1), {});
    expect(result).toEqual(true);
  });

  NotificationManager.error = _safeError;
  MenuSettingsService.emitter.emit = _safeEmit;
});
