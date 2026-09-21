import Records from '@citeck/records-core';
import { render } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';

import CurrentTasksDashlet from '../CurrentTasksDashlet';

import { EVENTS } from '@/components/dashboard/widgets/BaseWidget';

jest.mock('../CurrentTasks', () => () => null);

// Records.get(ref) is a global cache: the record (and its EventEmitter) outlives every widget
// mounted on it, so a listener that is never removed piles up on each re-open (COREDEV-522).
describe('CurrentTasksDashlet record event listeners', () => {
  const record = 'emodel/doc@current-tasks-listeners';
  const store = configureStore()({ view: { isMobile: false }, app: { dashboardEditable: false } });
  const mount = () =>
    render(
      <Provider store={store}>
        <CurrentTasksDashlet id="widget-1" record={record} tabId="tab-1" dashboardId="dash-1" />
      </Provider>
    );
  const count = () => Records.get(record).events.listenerCount(EVENTS.UPDATE_TASKS_WIDGETS);

  it('listens while mounted and stops listening on unmount', () => {
    expect(count()).toBe(0);

    const wrapper = mount();
    expect(count()).toBe(1);

    wrapper.unmount();
    expect(count()).toBe(0);
  });

  it('does not pile up listeners when the same record is opened again and again', () => {
    for (let i = 0; i < 5; i++) {
      mount().unmount();
    }

    expect(count()).toBe(0);
  });
});
