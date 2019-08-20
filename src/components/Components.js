import loadable from '@loadable/component';
import get from 'lodash/get';
import { deepClone, t } from '../helpers/util';
import isArray from 'lodash/isArray';
import isEmpty from 'lodash/isEmpty';
import uuidV4 from 'uuid/v4';

export const ComponentKeys = {
  LOGIN: 'login',
  PAGINATION: 'pagination',
  DOC_PREVIEW: 'doc-preview',
  JOURNAL: 'journal',
  COMMENTS: 'comments',
  PROPERTIES: 'properties',
  TASKS: 'tasks',
  CURRENT_TASKS: 'current-tasks',
  DOC_STATUS: 'doc-status',
  EVENTS_HISTORY: 'events-history',
  VERSIONS_JOURNAL: 'versions-journal'
};

export const DASHBOARD_TYPE = {
  CASE_DETAILS: 'case-details',
  USER: 'user-dashboard',
  SITE: 'site-dashboard'
};

export default class Components {
  static components = {
    [ComponentKeys.DOC_PREVIEW]: {
      path: './DocPreview',
      label: 'dashboard-settings.widget.preview',
      supportedDashboardTypes: [DASHBOARD_TYPE.CASE_DETAILS]
    },
    [ComponentKeys.JOURNAL]: {
      path: './Journals/JournalsDashlet/JournalsDashlet',
      label: 'dashboard-settings.widget.journal',
      supportedDashboardTypes: [DASHBOARD_TYPE.CASE_DETAILS, DASHBOARD_TYPE.SITE, DASHBOARD_TYPE.USER]
    },
    [ComponentKeys.COMMENTS]: {
      path: './Comments',
      label: 'dashboard-settings.widget.comments',
      supportedDashboardTypes: [DASHBOARD_TYPE.CASE_DETAILS]
    },
    [ComponentKeys.PROPERTIES]: {
      path: './Properties',
      label: 'dashboard-settings.widget.properties',
      supportedDashboardTypes: [DASHBOARD_TYPE.CASE_DETAILS]
    },
    [ComponentKeys.TASKS]: {
      path: './Tasks',
      label: 'dashboard-settings.widget.tasks',
      supportedDashboardTypes: [DASHBOARD_TYPE.CASE_DETAILS]
    },
    [ComponentKeys.CURRENT_TASKS]: {
      path: './CurrentTasks',
      label: 'dashboard-settings.widget.current-tasks',
      supportedDashboardTypes: [DASHBOARD_TYPE.CASE_DETAILS]
    },
    [ComponentKeys.DOC_STATUS]: {
      path: './DocStatus',
      label: 'dashboard-settings.widget.doc-status',
      supportedDashboardTypes: [DASHBOARD_TYPE.CASE_DETAILS]
    },
    [ComponentKeys.EVENTS_HISTORY]: {
      path: './EventsHistory',
      label: 'dashboard-settings.widget.events-history',
      supportedDashboardTypes: [DASHBOARD_TYPE.CASE_DETAILS]
    },
    [ComponentKeys.VERSIONS_JOURNAL]: {
      path: './VersionsJournal',
      label: 'dashboard-settings.widget.versions-journal',
      supportedDashboardTypes: [DASHBOARD_TYPE.CASE_DETAILS]
    }
  };

  static get(component) {
    const link = get(Components.components, [component, 'path']);

    if (!link) {
      return () => null;
    }

    return loadable(() => import(`${link}`));
  }

  static getComponentsFullData(dashboardType = DASHBOARD_TYPE.CASE_DETAILS) {
    const arrComponents = [];

    Object.entries(Components.components).forEach(([name, component]) => {
      if (component.supportedDashboardTypes.includes(dashboardType)) {
        arrComponents.push({
          name,
          label: t(component.label)
        });
      }
    });

    return arrComponents;
  }

  static setDefaultPropsOfWidgets(items) {
    if (!isArray(items) || isEmpty(items)) {
      return [];
    }

    return items.map(item => {
      return item.map(widget => {
        const defWidget = deepClone(widget);
        const props = widget.props || {};
        const config = props.config || {};

        defWidget.id = widget.id || uuidV4();
        defWidget.props = {
          ...props,
          id: props.id || defWidget.id,
          config: {
            ...config
          }
        };

        switch (defWidget.name) {
          case ComponentKeys.DOC_PREVIEW: {
            defWidget.props.config.link = config.link || '';
            break;
          }
          case ComponentKeys.JOURNAL: {
            break;
          }
          default:
            break;
        }

        return defWidget;
      });
    });
  }
}
