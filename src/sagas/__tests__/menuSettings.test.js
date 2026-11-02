import { runSaga } from 'redux-saga';

import { getSettingsConfig, saveMenuSettings, setLeftMenuItems, setLoading } from '@/actions/menuSettings';
import reducer from '@/reducers/menuSettings';
import { fetchSettingsConfig, runSaveMenuSettings } from '@/sagas/menuSettings';
import { NotificationManager } from '@/services/notifications';

jest.mock('@/services/notifications', () => ({ NotificationManager: { error: jest.fn(), success: jest.fn() } }));

const menu = () => ({
  id: 'test-menu',
  version: 3,
  authorities: [{ name: 'GROUP_test', ref: 'emodel/authority-group@test' }],
  menu: {
    left: { items: [{ id: 'existing', type: 'SECTION', label: 'Existing', items: [], allowedFor: ['GROUP_test'] }] },
    create: { items: [], allowedFor: ['GROUP_test'] },
    user: { items: [] }
  }
});

describe('menu settings configuration lifecycle', () => {
  let state;
  let api;
  const dispatch = action => {
    state = reducer(state, action);
  };
  const run = (saga, action) => runSaga({ dispatch, getState: () => ({ menuSettings: state }) }, saga, { api }, action).done;
  const load = async () => {
    dispatch(getSettingsConfig({ id: 'test-menu' }));
    await run(fetchSettingsConfig);
  };
  const save = async () => {
    dispatch(saveMenuSettings());
    await run(runSaveMenuSettings);
  };

  beforeEach(() => {
    state = reducer(undefined, {});
    api = {
      menu: {
        getMenuSettingsConfig: jest.fn().mockResolvedValue(menu()),
        saveMenuSettingsConfig: jest.fn().mockResolvedValue({}),
        saveGroupPriority: jest.fn()
      }
    };
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => jest.restoreAllMocks());

  it.each(['504 Gateway Timeout', 'Network error', 'Invalid configuration'])(
    'cannot save after %s, even if an edit action clears the general loading flag',
    async message => {
      api.menu.getMenuSettingsConfig.mockRejectedValueOnce(new Error(message));
      await load();
      expect(state.configLoadStatus).toBe('error');
      expect(state.isLoading).toBe(false);
      dispatch(setLeftMenuItems([]));
      await save();
      expect(api.menu.saveMenuSettingsConfig).not.toHaveBeenCalled();
      expect(api.menu.saveGroupPriority).not.toHaveBeenCalled();
      expect(NotificationManager.error).toHaveBeenCalled();
    }
  );

  it('blocks saves during a slow load, then preserves items, version and access after retry', async () => {
    api.menu.getMenuSettingsConfig.mockRejectedValueOnce(new Error('504'));
    await load();
    let resolve;
    api.menu.getMenuSettingsConfig.mockImplementationOnce(() => new Promise(done => (resolve = done)));
    dispatch(getSettingsConfig({ id: 'test-menu' }));
    const pending = run(fetchSettingsConfig);
    dispatch(setLoading(false));
    await save();
    expect(api.menu.saveMenuSettingsConfig).not.toHaveBeenCalled();
    expect(state.configLoadStatus).toBe('loading');
    resolve(menu());
    await pending;
    expect(state.configLoadStatus).toBe('loaded');
    dispatch(setLeftMenuItems([...state.leftItems, { id: 'added', type: 'SECTION', label: 'Added', items: [] }]));
    await save();
    const saved = api.menu.saveMenuSettingsConfig.mock.calls[0][0];
    expect(saved).toMatchObject({ id: 'test-menu', version: 3, authorities: ['GROUP_test'] });
    expect(saved.subMenu.left.items.map(item => item.id)).toEqual(['existing', 'added']);
    expect(saved.subMenu.left.items[0].allowedFor).toEqual(['GROUP_test']);
    expect(saved.subMenu.create.allowedFor).toEqual(['GROUP_test']);
  });

  it('allows a successfully loaded empty menu', async () => {
    api.menu.getMenuSettingsConfig.mockResolvedValueOnce({ ...menu(), menu: {}, authorities: [] });
    await load();
    expect(state.configLoadStatus).toBe('loaded');
    await save();
    expect(api.menu.saveMenuSettingsConfig).toHaveBeenCalledWith(
      expect.objectContaining({ version: 3, subMenu: { left: { items: [] }, create: { items: [], allowedFor: [] }, user: { items: [] } } })
    );
  });

  it('does not save read-only configurations or a different configuration while loading', async () => {
    await load();
    dispatch(getSettingsConfig({ id: 'other-menu', disabledEdit: true }));
    await run(fetchSettingsConfig);
    await save();
    expect(api.menu.saveMenuSettingsConfig).not.toHaveBeenCalled();
  });
});
