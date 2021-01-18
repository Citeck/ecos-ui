import { runSaga } from 'redux-saga';

import PageService from '../../services/PageService';
import { openActiveSection } from '../adminSection';

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

describe('adminSection sagas tests', () => {
  const _changeUrlLink = jest.spyOn(PageService, 'changeUrlLink').mockResolvedValue(null);

  describe('openActiveSection saga', () => {
    it('open type BPM"', async () => {
      const dispatched = [];

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
      expect(_changeUrlLink).toHaveBeenCalledWith('/v2/bpmn-designer', { pushHistory: true, updateUrl: true });
      expect(dispatched.length).toEqual(0);
    });

    it('open type JOURNAL"', async () => {
      const dispatched = [];

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
      expect(_changeUrlLink).toHaveBeenCalledWith('/v2/bpmn-designer?journalId=test', { pushHistory: true, updateUrl: true });
      expect(dispatched.length).toEqual(0);
    });

    it('open type DEV_TOOLS', async () => {
      const dispatched = [];

      await runSaga(
        {
          dispatch: action => dispatched.push(action),
          getState: () => ({ adminSection: { groupSectionList } })
        },
        openActiveSection,
        { logger },
        { payload: { type: 'DEV_TOOLS' } }
      ).done;

      expect(dispatched[0].payload.type).toEqual('BPM');
      expect(_changeUrlLink).toHaveBeenCalled();
      expect(_changeUrlLink).toHaveBeenCalledWith('/v2/dev-tools', { openNewTab: true });
    });
  });
});
