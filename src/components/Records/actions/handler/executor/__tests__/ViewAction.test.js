import { NotificationManager } from 'react-notifications';

import MenuSettingsService from '../../../../../../services/MenuSettingsService';
import actionsRegistry from '../../../actionsRegistry';
import '../../../index';
import ViewAction from '../ViewAction';

const RecordIds = {};

jest.spyOn(global, 'fetch').mockImplementation((url, request) => {
  const body = JSON.parse(request.body);

  switch (body.record) {
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

  //todo others cases

  NotificationManager.error = _safeError;
  MenuSettingsService.emitter.emit = _safeEmit;
});
