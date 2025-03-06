import { NotificationManager } from '@/services/notifications';

import EcosFormUtils from '../../../../../EcosForm/EcosFormUtils';
import Records from '../../../../Records';

import actionsRegistry from '../../../actionsRegistry';
import '../../../index';
import EditAction from '../EditAction';
import { SourcesId } from '../../../../../../constants';

const RecordIds = {
  TASK_REF: 'workspace://SpacesStore/test-task',
  TASK_ID: 'activiti$task'
};

jest.spyOn(global, 'fetch').mockImplementation((url, request) => {
  const body = JSON.parse(request.body);
  const records = body.records;

  const resolvedRecords = records.map(rec => {
    switch (rec) {
      case RecordIds.TASK_REF:
        return {
          id: RecordIds.TASK_REF,
          attributes: {
            'cm:name?str': RecordIds.TASK_ID
          }
        };
      default:
        return {
          id: 'workspace://SpacesStore/a0652fbe-8b72-4a1c-9ca7-3d72c72a7f9e',
          attributes: {}
        };
    }
  });

  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ records: resolvedRecords })
  });
});

describe('Edit Action', () => {
  const _safeError = NotificationManager.error;
  actionsRegistry.register(new EditAction());
  const action = actionsRegistry.getHandler(EditAction.ACTION_ID);

  NotificationManager.error = () => undefined;

  it('case Task no taskId', async () => {
    const result = await action.execForRecord(Records.get(null), { config: { mode: 'task' } });
    expect(result).toEqual(false);
  });

  it('case Task form - fallback ', async () => {
    delete window.open;
    window.open = () => undefined;

    jest.spyOn(EcosFormUtils, 'editRecord').mockImplementation(config => {
      expect(config.recordRef).toEqual(`${SourcesId.TASK}@${RecordIds.TASK_ID}`);
      config.fallback();
    });

    const result = await action.execForRecord(Records.get(RecordIds.TASK_REF), { config: { mode: 'task' } });
    expect(result).toEqual(false);
  });

  it('case Task form - onSubmit', async () => {
    delete window.open;
    window.open = () => undefined;

    jest.spyOn(EcosFormUtils, 'editRecord').mockImplementation(config => {
      expect(config.recordRef).toEqual(`${SourcesId.TASK}@${RecordIds.TASK_ID}`);
      config.onSubmit();
    });

    const result = await action.execForRecord(Records.get(RecordIds.TASK_REF), { config: { mode: 'task' } });
    expect(result).toEqual(true);
  });

  //todo default case

  NotificationManager.error = _safeError;
});
