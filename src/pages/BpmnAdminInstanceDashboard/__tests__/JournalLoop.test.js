import { INSTANCE_TABS_TYPES } from '@citeck/constants/instanceAdmin';
import { act, render } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';

import { getJournalTabInfo } from '../../../actions/instanceAdmin';
import configureStore from '../../../store';
import Journal from '../JournalsTabs/Journal';

// COREDEV-492: a record ref with a DOT used to defeat the lodash string paths in
// `selectors/instanceAdmin`, so the selectors handed the component a brand new `{}` on every store
// change, the effect re-fired and the page queried `eproc/bpmn-variable-instance` forever.
const instanceId = 'emodel/person@test.dot';

// The regression is an unbounded render/dispatch loop: without a hard stop the test would hang
// instead of failing, so the store is fenced and throws as soon as the loop is proven.
const MAX_DISPATCHES = 5;

const flush = async (times = 5) => {
  for (let i = 0; i < times; i++) {
    // eslint-disable-next-line no-await-in-loop
    await act(async () => {
      await Promise.resolve();
    });
  }
};

describe('BpmnAdminInstanceDashboard Journal', () => {
  it('requests the tab data exactly once for a record ref containing a dot', async () => {
    const apiGetJournalTabInfo = jest.fn(() => Promise.resolve({ records: [], totalCount: 0 }));
    const store = configureStore({ api: { instanceAdmin: { getJournalTabInfo: apiGetJournalTabInfo } } }, {});

    let dispatchCount = 0;
    const originalDispatch = store.dispatch;

    store.dispatch = action => {
      if (action && action.type === getJournalTabInfo.toString()) {
        dispatchCount++;

        if (dispatchCount > MAX_DISPATCHES) {
          throw new Error(`getJournalTabInfo was dispatched more than ${MAX_DISPATCHES} times — the reload loop is back`);
        }
      }

      return originalDispatch(action);
    };

    render(
      <Provider store={store}>
        <Journal instanceId={instanceId} tabId={INSTANCE_TABS_TYPES.VARIABLES} />
      </Provider>
    );

    await flush();

    expect(dispatchCount).toBe(1);
    expect(apiGetJournalTabInfo).toHaveBeenCalledTimes(1);
  });
});
