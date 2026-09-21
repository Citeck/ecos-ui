import Records from '@citeck/records-core';

import PropertiesDashlet from '../PropertiesDashlet';

import { EVENTS } from '@/components/dashboard/widgets/BaseWidget';

// PropertiesDashlet is too heavy to render here (see PropertiesDashlet.test.js), so the lifecycle
// is driven by hand on a real instance: constructor → componentDidMount → componentWillUnmount.
// Records.get(ref) is a global cache: the record (and its EventEmitter) outlives every widget
// mounted on it, so a listener that is never removed piles up on each re-open (COREDEV-522).
describe('PropertiesDashlet record event listeners', () => {
  const record = 'emodel/doc@properties-listeners';
  const count = event => Records.get(record).events.listenerCount(event);

  function createDashlet() {
    const instance = new PropertiesDashlet({ record, id: 'w1', config: {}, tabId: 't1', dashboardId: 'd1' });

    instance.setState = jest.fn((state, cb) => {
      Object.assign(instance.state, typeof state === 'function' ? state(instance.state) : state);
      if (cb) cb();
    });
    instance.checkPermissions = jest.fn();

    return instance;
  }

  const openAndClose = () => {
    const instance = createDashlet();
    instance.componentDidMount();
    instance.componentWillUnmount();
  };

  it('a constructed but never mounted instance (StrictMode) does not listen', () => {
    createDashlet();

    expect(count(EVENTS.ASSOC_UPDATE)).toBe(0);
    expect(count(EVENTS.ATTS_UPDATED)).toBe(0);
  });

  it('listens while mounted and stops listening on unmount', () => {
    const instance = createDashlet();

    instance.componentDidMount();
    expect(count(EVENTS.ASSOC_UPDATE)).toBe(1);
    expect(count(EVENTS.ATTS_UPDATED)).toBe(1);

    instance.componentWillUnmount();
    expect(count(EVENTS.ASSOC_UPDATE)).toBe(0);
    expect(count(EVENTS.ATTS_UPDATED)).toBe(0);
  });

  it('does not pile up listeners when the same record is opened again and again', () => {
    for (let i = 0; i < 5; i++) {
      openAndClose();
    }

    expect(count(EVENTS.ASSOC_UPDATE)).toBe(0);
    expect(count(EVENTS.ATTS_UPDATED)).toBe(0);
  });
});
