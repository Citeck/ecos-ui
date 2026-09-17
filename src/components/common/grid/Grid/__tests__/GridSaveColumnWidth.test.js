import { render } from '@testing-library/react';
import React from 'react';
import { act } from 'react-dom/test-utils';

import Grid from '../Grid';

import { pagesStore } from '@/helpers/indexedDB';

// A user name with a DOT is the common case in ECOS (`jane.doe`). lodash `get` with a
// STRING path splits it, so the saved settings of such a user used to be replaced by `{}` on
// every column-width save (COREDEV-492).
const USER_NAME = 'jane.doe';
const JOURNAL_ID = 'some-journal';
const JOURNAL_SETTING_ID = 'uiserv/journal-settings@s1';

jest.mock('@/helpers/indexedDB', () => ({
  pagesStore: {
    get: jest.fn(),
    put: jest.fn()
  },
  snippetsStore: {
    get: jest.fn(),
    put: jest.fn()
  }
}));

jest.mock('@/helpers/util', () => ({
  ...jest.requireActual('@/helpers/util'),
  getCurrentUserName: () => 'jane.doe'
}));

jest.mock('@/services/notifications', () => ({
  NotificationManager: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn()
  }
}));

const columns = [
  { dataField: 'colA', text: 'A', attribute: 'colA', name: 'colA' },
  { dataField: 'colB', text: 'B', attribute: 'colB', name: 'colB' }
];
const data = [{ id: 'rec@1', colA: 'a', colB: 'b' }];

describe('Grid.saveColumnWidth with a dotted user name', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('keeps the previously saved widths of the same user', async () => {
    pagesStore.get.mockResolvedValue({
      pageId: JOURNAL_ID,
      [USER_NAME]: {
        settings: {
          [JOURNAL_SETTING_ID]: {
            colA: { width: 100 }
          }
        },
        columns: {}
      }
    });

    const gridRef = React.createRef();

    render(
      <Grid
        ref={gridRef}
        columns={columns}
        data={data}
        journalId={JOURNAL_ID}
        journalSetting={{ id: JOURNAL_SETTING_ID }}
        onColumnSave={jest.fn()}
      />
    );

    const instance = gridRef.current;

    // The width tooltip is rendered against a DOM node: give reactstrap a real target.
    const target = document.createElement('div');
    target.id = 'column-width-target';
    document.body.appendChild(target);

    await act(async () => {
      instance.setState({ updatedColumn: { name: 'colB', width: '150px', id: target.id } });
    });

    await act(async () => {
      await instance.saveColumnWidth();
    });

    expect(pagesStore.put).toHaveBeenCalledTimes(1);

    const saved = pagesStore.put.mock.calls[0][0];
    const settings = saved[USER_NAME].settings[JOURNAL_SETTING_ID];

    expect(settings).toEqual({
      colA: { width: 100 },
      colB: { width: '150px' }
    });
  });
});
