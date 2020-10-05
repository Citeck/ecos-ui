import { NotificationManager } from 'react-notifications';
import Records from '../../../../Records';
import actionsRegistry from '../../../actionsRegistry';
import '../../../index';
import EditAction from '../EditAction';

const RecordIds = {
  TASK_REF: 'workspace://SpacesStore/test-task'
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
  const _safeError = NotificationManager.error;
  const action = actionsRegistry.getHandler(EditAction.ACTION_ID);

  NotificationManager.error = () => undefined;

  it('case Task no taskId', async () => {
    const result = await action.execForRecord(Records.get(null), { config: { mode: 'task' } });
    expect(result).toEqual(false);
  });

  it('case Task form fallback ', async () => {
    delete window.open;
    window.open = () => undefined;

    const result = await action.execForRecord(Records.get(RecordIds.TASK_REF), { config: { mode: 'task' } });
    expect(result).toEqual(true);
  });

  //todo default case

  NotificationManager.error = _safeError;
});
