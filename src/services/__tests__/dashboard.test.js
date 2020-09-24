import get from 'lodash/get';

import DashboardService from '../dashboard';
import pageTabList from '../pageTabs/PageTabList';
import { t } from '../../helpers/util';
import { LayoutTypes } from '../../constants/layout';
import { SourcesId } from '../../constants';
import {
  CONFIGS,
  FULL_DASHBOARD_ID,
  getDefaultDashboardConfig,
  OLD_TO_NEW_CONFIG,
  SHORT_DASHBOARD_ID,
  WIDGETS_BY_ID
} from '../__mocks__/dashboard.mock';
import { CONFIG_VERSION } from '../../constants/dashboard';

describe('Dashboard Service', () => {
  describe('Getter key', () => {
    it('Without active tab', () => {
      const key = DashboardService.key;

      expect(key).toEqual(null);
    });

    it('There is an active tab', () => {
      pageTabList.tabs = {
        tabs: [{ isActive: true, id: 'page-test-id' }]
      };
      const key = DashboardService.key;

      expect(key).toEqual('page-test-id');
    });
  });

  describe('Method defaultDashboardTab', () => {
    it('Tab with default label and transmitted layout id', () => {
      const idLayout = DashboardService.newIdLayout;
      const tab = DashboardService.defaultDashboardTab(idLayout);

      expect(tab).toEqual({
        idLayout,
        label: t('page-tabs.tab-name-default')
      });
    });
  });

  describe('Method defaultDashboardConfig', () => {
    it('Default dashboard config with transmitted layout id', () => {
      const idLayout = DashboardService.newIdLayout;
      const config = DashboardService.defaultDashboardConfig(idLayout);

      expect(config).toEqual(getDefaultDashboardConfig(idLayout));
    });
  });

  describe('Method formShortId', () => {
    const data = [
      {
        title: 'Input parameter - full dashboard id',
        input: FULL_DASHBOARD_ID,
        output: SHORT_DASHBOARD_ID
      },
      {
        title: 'Input parameter - short dashboard id',
        input: SHORT_DASHBOARD_ID,
        output: SHORT_DASHBOARD_ID
      },
      {
        title: 'Without input parameter',
        input: '',
        output: ''
      }
    ];

    data.forEach(item => {
      it(item.title, () => {
        expect(DashboardService.formShortId(item.input)).toEqual(item.output);
      });
    });
  });

  describe('Method checkDashboardResult', () => {
    it('Empty dashboard result - generate default dashboard config', () => {
      const result = DashboardService.checkDashboardResult();
      const defaultConfig = getDefaultDashboardConfig();

      expect(get(result, '[0].layout.columns')).toEqual(get(defaultConfig, 'layout.columns'));
      expect(get(result, '[0].layout.tab.label')).toEqual(get(defaultConfig, 'layout.tab.label'));
      expect(get(result, '[0].layout.type')).toEqual(LayoutTypes.TWO_COLUMNS_BS);
    });

    it('Not empty dashboard result', () => {
      const result = DashboardService.checkDashboardResult([{ layout: {} }]);

      expect(result).toEqual([{ layout: {} }]);
    });
  });

  describe('Method parseRequestResult', () => {
    const data = [
      {
        title: 'Empty request result',
        input: null,
        output: {}
      },
      {
        title: 'Request without id',
        input: { params: {} },
        output: { dashboardId: '' }
      },
      {
        title: 'Request without dashboard id (full format)',
        input: { id: FULL_DASHBOARD_ID },
        output: { dashboardId: SHORT_DASHBOARD_ID }
      },
      {
        title: 'Request without dashboard id (short format)',
        input: { id: SHORT_DASHBOARD_ID },
        output: { dashboardId: SHORT_DASHBOARD_ID }
      }
    ];

    data.forEach(item => {
      it(item.title, () => {
        expect(DashboardService.parseRequestResult(item.input)).toEqual(item.output);
      });
    });
  });

  describe('Method getCacheKey', () => {
    const data = [
      {
        title: 'Empty input data',
        input: undefined,
        output: 'undefined|undefined'
      },
      {
        title: 'Input object with type data',
        input: { type: 'dashboard' },
        output: 'dashboard|undefined'
      },
      {
        title: 'Input object with user data',
        input: { user: 'admin' },
        output: 'undefined|admin'
      },
      {
        title: 'Input object with type & user data',
        input: { user: 'admin', type: 'dashboard' },
        output: 'dashboard|admin'
      }
    ];

    data.forEach(item => {
      it(item.title, () => {
        expect(DashboardService.getCacheKey(item.input)).toEqual(item.output);
      });
    });
  });

  describe('Method defineWaySavingDashboard', () => {
    const data = [
      {
        title: 'Create (keys equal, not for all users, not user dashboard)',
        input: [true],
        output: DashboardService.SaveWays.CREATE
      },
      {
        title: 'Update (keys equal, not for all users, is user dashboard)',
        input: [true, false, true],
        output: DashboardService.SaveWays.UPDATE
      },
      {
        title: 'Update (keys equal, for all users, not user dashboard)',
        input: [true, true],
        output: DashboardService.SaveWays.UPDATE
      },
      {
        title: 'Confirm (keys not equal)',
        input: [false],
        output: DashboardService.SaveWays.CONFIRM
      },
      {
        title: 'Confirm (keys equal, for all users, is user dashboard)',
        input: [true, true, true],
        output: DashboardService.SaveWays.CONFIRM
      },
      {
        title: 'Confirm (without params)',
        input: [],
        output: DashboardService.SaveWays.CONFIRM
      }
    ];

    data.forEach(item => {
      it(item.title, () => {
        expect(DashboardService.defineWaySavingDashboard(...item.input)).toEqual(item.output);
      });
    });
  });

  describe('Method generateNewMobileConfig', () => {
    const data = [
      {
        title: 'Empty config',
        input: [],
        output: []
      },
      {
        title: 'Not empty config',
        input: CONFIGS[0][0],
        output: CONFIGS[0][1]
      }
    ];

    data.forEach(item => {
      it(item.title, () => {
        const result = DashboardService.generateNewMobileConfig(item.input);

        expect(result).toEqual(item.output);
      });
    });
  });

  describe('Method getWidgetsById', () => {
    const data = [
      {
        title: 'Without widgets',
        input: [],
        output: {}
      },
      {
        title: 'With widgets',
        input: WIDGETS_BY_ID[0][0],
        output: WIDGETS_BY_ID[0][1]
      }
    ];

    data.forEach(item => {
      it(item.title, () => {
        const result = DashboardService.getWidgetsById(item.input);

        expect(result).toEqual(item.output);
      });
    });
  });

  describe('Method migrateConfigFromOldVersion', () => {
    const data = [
      {
        title: 'Input config of old version',
        input: OLD_TO_NEW_CONFIG[0][0],
        output: OLD_TO_NEW_CONFIG[0][1]
      },
      {
        title: 'Input config of new version',
        input: OLD_TO_NEW_CONFIG[1][0],
        output: OLD_TO_NEW_CONFIG[1][1]
      }
    ];

    data.forEach(item => {
      it(item.title, () => {
        const result = DashboardService.migrateConfigFromOldVersion(item.input);

        expect(result).toEqual(item.output);
      });
    });

    it('Input empty data (generate default new version config)', () => {
      const result = DashboardService.migrateConfigFromOldVersion();

      expect(result.version).toEqual(CONFIG_VERSION);
      expect(get(result, [result.version, 'desktop'], []).length).toEqual(1);
      expect(get(result, [result.version, 'mobile'], []).length).toEqual(1);
      expect(get(result, [result.version, 'desktop', 0, 'id'])).toEqual(get(result, [result.version, 'mobile', 0, 'id']));
    });
  });
});
