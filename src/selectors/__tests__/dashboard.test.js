import { selectDashboardConfigs, selectIdentificationForSet, selectIdentificationForView, selectResetStatus } from '../dashboard';

// `DashboardService.key` is the active page tab id — external data. A STRING lodash path would be
// split on its dots and brackets and never find the stored dashboard (COREDEV-492).
const TAB_ID = 'page-tab-a.b[c]';

jest.mock('../../services/dashboard', () => ({
  __esModule: true,
  default: {
    get key() {
      return 'page-tab-a.b[c]';
    }
  }
}));

const identification = { id: 'uiserv/dashboard@d1', key: 'case-details' };
const config = [{ id: 'layout_1' }];
const mobileConfig = [{ id: 'layout_mobile' }];

const state = {
  dashboard: {
    [TAB_ID]: {
      identification,
      reset: true,
      config,
      mobileConfig
    }
  },
  dashboardSettings: {
    [TAB_ID]: { identification }
  },
  view: { isMobile: false }
};

describe('dashboard selectors with a tab id containing a dot and brackets', () => {
  it('selectIdentificationForView returns the stored identification', () => {
    expect(selectIdentificationForView(state)).toBe(identification);
  });

  it('selectIdentificationForSet returns the stored identification', () => {
    expect(selectIdentificationForSet(state, TAB_ID)).toBe(identification);
  });

  it('selectResetStatus returns the stored reset flag', () => {
    expect(selectResetStatus(state)).toBe(true);
  });

  it('selectDashboardConfigs returns the stored configs', () => {
    expect(selectDashboardConfigs(state)).toEqual({
      layouts: config,
      mobile: mobileConfig,
      isMobile: false
    });
  });
});
