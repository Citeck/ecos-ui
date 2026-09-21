import Records from '@citeck/records-core';

import ConnectedDashboard from '../Dashboard';

// Records.get(ref) is a global cache: the record (and its watcher list) outlives every page
// instance mounted on it. React constructs the page more often than it mounts it (StrictMode),
// so a watcher taken in the constructor is only ever removed by the instance that mounts (COREDEV-522).
describe('Dashboard page record watchers', () => {
  const Dashboard = ConnectedDashboard.WrappedComponent;
  const record = 'emodel/doc@dashboard-watchers';
  const watchers = () => Records.get(record)._watchers.length;

  beforeAll(() => {
    window.history.replaceState({}, '', `/v2/dashboard?ws=TEST&recordRef=${record}`);
    jest.spyOn(Records.get(record), 'load').mockResolvedValue(null);
  });

  const createPage = () => {
    const instance = new Dashboard({ getDashboardConfig: jest.fn(), getDashboardTitle: jest.fn(), config: [] });

    instance.setState = jest.fn((state, cb) => {
      Object.assign(instance.state, typeof state === 'function' ? state(instance.state) : state);
      if (cb) cb();
    });

    return instance;
  };

  it('a constructed but never mounted page (StrictMode) does not watch', () => {
    createPage();

    expect(watchers()).toBe(0);
  });

  it('watches while mounted and stops watching on unmount', () => {
    const instance = createPage();

    instance.componentDidMount();
    expect(watchers()).toBeGreaterThan(0);

    instance.componentWillUnmount();
    expect(watchers()).toBe(0);
  });

  it('does not pile up watchers when the same record is opened again and again', () => {
    for (let i = 0; i < 5; i++) {
      const instance = createPage();
      instance.componentDidMount();
      instance.componentWillUnmount();
    }

    expect(watchers()).toBe(0);
  });
});
