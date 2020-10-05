import { NotificationManager } from 'react-notifications';

import PageService from '../../../../../../services/PageService';
import { NEW_VERSION_PREFIX } from '../../../../../../helpers/export/urls';
import actionsRegistry from '../../../actionsRegistry';
import Records from '../../../../Records';

import '../../../index';
import ViewAction from '../ViewAction';

const RecordIds = {
  TASK_1: 'workspace://SpacesStore/task-document-dashboard',
  TASK_2: 'workspace://SpacesStore/view-task-1',
  TASK_3: 'workspace://SpacesStore/view-task-2',
  TASK_id: 'activiti$task'
};

jest.spyOn(global, 'fetch').mockImplementation((url, request) => {
  const body = JSON.parse(request.body);

  switch (body.record) {
    case RecordIds.TASK_1:
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            id: RecordIds.TASK_1,
            attributes: {
              'wfm:document?id': RecordIds.TASK_1
            }
          })
      });
    case RecordIds.TASK_2:
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            id: RecordIds.TASK_2,
            attributes: {
              'wfm:document?id': RecordIds.TASK_2
            }
          })
      });
    case RecordIds.TASK_3:
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            id: RecordIds.TASK_3,
            attributes: {
              'cm:name?str': RecordIds.TASK_id
            }
          })
      });

    case RecordIds.TASK_id:
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            id: RecordIds.TASK_3,
            attributes: {
              'workflow?id': RecordIds.TASK_3
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
  const _safe_error = NotificationManager.error;
  const _safe_changeUrlLink = PageService.changeUrlLink;
  const action = actionsRegistry.getHandler(ViewAction.ACTION_ID);

  NotificationManager.error = () => undefined;

  delete window.location;
  delete window.open;
  window.open = (...data) => {
    console.log(data);
  };

  it('case type -> task-document-dashboard', async () => {
    window.location = { pathname: `${NEW_VERSION_PREFIX}/test-page` };
    PageService.changeUrlLink = (link = '') => {
      expect(link).toEqual(`/v2/dashboard?recordRef=${RecordIds.TASK_1}`);
    };
    const result = await action.execForRecord(Records.get(RecordIds.TASK_1), { config: { viewType: 'task-document-dashboard' } });
    expect(result).toEqual(false);
  });

  it('case type -> view-task > wfm:document?id', async () => {
    window.location = { pathname: `${NEW_VERSION_PREFIX}/test-page` };
    PageService.changeUrlLink = (link = '') => {
      expect(link).toEqual(`/v2/dashboard?recordRef=${RecordIds.TASK_2}`);
    };
    const result = await action.execForRecord(Records.get(RecordIds.TASK_2), { config: { viewType: 'view-task' } });
    expect(result).toEqual(false);
  });

  it('case type -> view-task > workflow?id', async () => {
    window.location = { pathname: `${NEW_VERSION_PREFIX}/test-page` };
    PageService.changeUrlLink = (link = '') => {
      expect(link).toEqual(`/v2/dashboard?recordRef=${RecordIds.TASK_3}`);
    };
    const result = await action.execForRecord(Records.get(RecordIds.TASK_3), { config: { viewType: 'view-task' } });
    expect(result).toEqual(false);
  });

  //todo others cases

  NotificationManager.error = _safe_error;
  PageService.changeUrlLink = _safe_changeUrlLink;
});
