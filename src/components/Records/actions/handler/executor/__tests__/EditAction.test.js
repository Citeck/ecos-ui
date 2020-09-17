import { NotificationManager } from 'react-notifications';

import MenuSettingsService from '../../../../../../services/MenuSettingsService';
import Records from '../../../../Records';
import actionsRegistry from '../../../actionsRegistry';
import '../../../index';
import EditAction from '../EditAction';

const RecordIds = {
  TASK_REF: 'workspace://SpacesStore/test-task',
  MENU: 'uiserv/menu@test-menu'
};

jest.spyOn(global, 'fetch').mockImplementation((url, request) => {
  const body = JSON.parse(request.body);

  switch (body.record) {
    case RecordIds.TASK_REF:
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            id: RecordIds.TASK_REF,
            attributes: {
              'cm:name?str': 'activiti$task'
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

describe('Edit Action', () => {
  const action = actionsRegistry.getHandler(EditAction.ACTION_ID);

  it('case Task no taskId', async () => {
    const _safe = NotificationManager.error;
    NotificationManager.error = () => undefined;

    const result = await action.execForRecord(Records.get(null), { config: { mode: 'task' } });
    expect(result).toEqual(false);

    NotificationManager.error = _safe;
  });

  it('case Task form fallback ', async () => {
    delete window.open;
    window.open = () => undefined;

    const result = await action.execForRecord(Records.get(RecordIds.TASK_REF), { config: { mode: 'task' } });
    expect(result).toEqual(false);
  });

  it('case Menu', async () => {
    const _safe = MenuSettingsService.emitter.emit;
    MenuSettingsService.emitter.emit = (show, id, callback) => callback(show);

    const result = await action.execForRecord(Records.get(RecordIds.MENU), {});
    expect(result).toEqual(MenuSettingsService.Events.SHOW);

    MenuSettingsService.emitter.emit = _safe;
  });
});
