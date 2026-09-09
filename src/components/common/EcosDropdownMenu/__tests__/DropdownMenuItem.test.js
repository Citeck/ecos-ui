import { mapStateToProps } from '../DropdownMenuItem';

import pageTabList from '@/services/pageTabs/PageTabList';

// The active tab id is external data: a STRING lodash path would be split on its dots and brackets
// and the dashboard id would always fall back to '' (COREDEV-492).
const TAB_ID = 'page-tab-a.b[c]';

jest.mock('@/services/pageTabs/PageTabList', () => ({
  __esModule: true,
  default: { activeTabId: 'page-tab-a.b[c]' }
}));

describe('DropdownMenuItem.mapStateToProps', () => {
  it('reads the dashboard id of a tab whose id contains a dot and brackets', () => {
    expect(pageTabList.activeTabId).toBe(TAB_ID);

    const state = {
      dashboard: {
        [TAB_ID]: { identification: { id: 'uiserv/dashboard@d1' } }
      }
    };

    expect(mapStateToProps(state)).toEqual({ dashboardId: 'uiserv/dashboard@d1' });
  });

  it('falls back to an empty string when there is no dashboard for the tab', () => {
    expect(mapStateToProps({ dashboard: {} })).toEqual({ dashboardId: '' });
  });
});
