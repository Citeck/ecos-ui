import { runSaga } from 'redux-saga';

import PageService from '../../services/PageService';
import { openActiveSection } from '../adminSection';
import { NEW_VERSION_PREFIX } from '../../helpers/export/urls';

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

  describe('openActiveSection saga', () => {
    it('open type BPM from alike type', async () => {
      const dispatched = [];
      window.location = { href: `${NEW_VERSION_PREFIX}/bpmn-designer?journalId=000` };

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
      expect(_changeUrlLink).toHaveBeenCalledWith('/v2/bpmn-designer', { openNewTab: false, pushHistory: true, updateUrl: true });
      expect(dispatched.length).toEqual(0);
    });

    it('open type JOURNAL from alike type', async () => {
      const dispatched = [];
      window.location = { href: `${NEW_VERSION_PREFIX}/bpmn-designer` };

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
      expect(_changeUrlLink).toHaveBeenCalledWith('/v2/bpmn-designer?journalId=test', {
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
      expect(_changeUrlLink).toHaveBeenCalledWith('/v2/dev-tools', { openNewTab: false, pushHistory: true, updateUrl: true });
      expect(dispatched.length).toEqual(0);
    });

    it('open type DEV_TOOLS from diff type', async () => {
      const dispatched = [];
      window.location = { href: `${NEW_VERSION_PREFIX}/bpmn-designer` };

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
      expect(_changeUrlLink).toHaveBeenCalledWith('/v2/dev-tools', { openNewTab: true, pushHistory: true, updateUrl: false });
      expect(dispatched.length).toEqual(0);
    });
  });
});
