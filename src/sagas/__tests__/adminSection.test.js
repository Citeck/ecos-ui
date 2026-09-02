import { runSaga } from 'redux-saga';

import { setGroupSectionList } from '../../actions/adminSection';
import { t } from '../../helpers/util';
import PageService from '../../services/PageService';
import { doFetchGroupSectionList, openActiveSection } from '../adminSection';
import { NEW_VERSION_PREFIX } from '../../helpers/export/urls';
import { NotificationManager } from '@/services/notifications';

jest.mock('@/services/notifications', () => ({
  NotificationManager: {
    error: jest.fn(),
    success: jest.fn()
  }
}));

const logger = { error: jest.fn() };

const groupSectionList = [
  {
    label: 'Управление системой',
    sections: [{ label: 'Инструменты разработчика', type: 'DEV_TOOLS', config: {} }]
  },
  {
    label: 'Управление процессами',
    sections: [{ label: 'Модели бизнес-процессов', type: 'BPM', config: {} }]
  },
  {
    label: 'Модель',
    sections: [{ label: 'Типы данных', type: 'JOURNAL', config: { journalId: 'ecos-types' } }]
  }
];

afterEach(() => {
  jest.clearAllMocks();
});

beforeEach(() => {
  delete window.location;
});

describe('adminSection sagas tests', () => {
  const _changeUrlLink = jest.spyOn(PageService, 'changeUrlLink').mockResolvedValue(null);

  describe('doFetchGroupSectionList saga', () => {
    it('stores the list on success and does not notify', async () => {
      const dispatched = [];
      window.location = { href: `${NEW_VERSION_PREFIX}/admin?type=BPM` };
      const api = { adminSection: { getGroupSectionList: jest.fn().mockResolvedValue(groupSectionList) } };

      await runSaga(
        { dispatch: action => dispatched.push(action), getState: () => ({}) },
        doFetchGroupSectionList,
        { api },
        { payload: {} }
      ).done;

      expect(dispatched[0]).toEqual(setGroupSectionList(groupSectionList));
      expect(NotificationManager.error).not.toHaveBeenCalled();
    });

    // COREDEV-466: the server text must reach the user instead of a silently empty admin menu
    it('shows the server error text and keeps an empty list when the api rejects', async () => {
      const dispatched = [];
      window.location = { href: `${NEW_VERSION_PREFIX}/admin` };
      const serverText = 'Permission denied for admin sections';
      const api = { adminSection: { getGroupSectionList: jest.fn().mockRejectedValue(new Error(serverText)) } };

      await runSaga(
        { dispatch: action => dispatched.push(action), getState: () => ({}) },
        doFetchGroupSectionList,
        { api },
        { payload: {} }
      ).done;

      expect(NotificationManager.error).toHaveBeenCalledTimes(1);
      expect(NotificationManager.error).toHaveBeenCalledWith(serverText, t('error'));
      expect(dispatched).toEqual([setGroupSectionList([])]);
    });
  });

  describe('openActiveSection saga', () => {
    it('open type BPM from alike type', async () => {
      const dispatched = [];
      window.location = { href: `${NEW_VERSION_PREFIX}/admin?journalId=000` };

      await runSaga(
        {
          dispatch: action => dispatched.push(action),
          getState: () => ({ adminSection: { groupSectionList } })
        },
        openActiveSection,
        { logger },
        { payload: { type: 'BPM' } }
      ).done;

      expect(_changeUrlLink).toHaveBeenCalled();
      expect(_changeUrlLink).toHaveBeenCalledWith('/v2/admin?type=BPM', { openNewTab: false, pushHistory: true, updateUrl: true });
      expect(dispatched.length).toEqual(0);
    });

    it('open type JOURNAL from alike type', async () => {
      const dispatched = [];
      window.location = { href: `${NEW_VERSION_PREFIX}/admin` };

      await runSaga(
        {
          dispatch: action => dispatched.push(action),
          getState: () => ({ adminSection: { groupSectionList } })
        },
        openActiveSection,
        { logger },
        { payload: { type: 'JOURNAL', config: { journalId: 'test' } } }
      ).done;

      expect(_changeUrlLink).toHaveBeenCalled();
      expect(_changeUrlLink).toHaveBeenCalledWith('/v2/admin?journalId=test&type=JOURNAL', {
        openNewTab: false,
        pushHistory: true,
        updateUrl: true
      });
      expect(dispatched.length).toEqual(0);
    });

    it('open type DEV_TOOLS from alike type', async () => {
      const dispatched = [];
      window.location = { href: `${NEW_VERSION_PREFIX}/dev-tools` };

      await runSaga(
        {
          dispatch: action => dispatched.push(action),
          getState: () => ({ adminSection: { groupSectionList } })
        },
        openActiveSection,
        { logger },
        { payload: { type: 'DEV_TOOLS' } }
      ).done;

      expect(_changeUrlLink).toHaveBeenCalled();
      expect(_changeUrlLink).toHaveBeenCalledWith('/v2/admin?type=DEV_TOOLS', {
        openNewTab: false,
        pushHistory: true,
        updateUrl: true
      });
      expect(dispatched.length).toEqual(0);
    });

    it('open type DEV_TOOLS from diff type', async () => {
      const dispatched = [];
      window.location = { href: `${NEW_VERSION_PREFIX}/admin` };

      await runSaga(
        {
          dispatch: action => dispatched.push(action),
          getState: () => ({ adminSection: { groupSectionList } })
        },
        openActiveSection,
        { logger },
        { payload: { type: 'DEV_TOOLS' } }
      ).done;

      expect(_changeUrlLink).toHaveBeenCalled();
      expect(_changeUrlLink).toHaveBeenCalledWith('/v2/admin?type=DEV_TOOLS', {
        openNewTab: true,
        pushHistory: true,
        updateUrl: false
      });
      expect(dispatched.length).toEqual(0);
    });
  });
});
