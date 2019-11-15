import loadable from '@loadable/component';
import get from 'lodash/get';
import isArray from 'lodash/isArray';
import isEmpty from 'lodash/isEmpty';
import uuidV4 from 'uuid/v4';
import { deepClone } from '../helpers/util';
import { DashboardTypes } from '../constants/dashboard';

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
  VERSIONS_JOURNAL: 'versions-journal',
  DOC_ASSOCIATIONS: 'doc-associations',
  RECORD_ACTIONS: 'record-actions',
  WEB_PAGE: 'web-page',
  BARCODE: 'barcode'
};

/**
 * При добавлении нового виджета, необходимо его зарегистрировать
 * в объекте components
 *
 * Если виджет должен отображаться для абсолютно всех дашбордов,
 * необходимо поместить его ключ в массив allDashboardsComponents
 *
 * Если виджет должен отображаться только на определенных типах дашбордов,
 * необходимо при регистрации в объект components, в поле supportedDashboardTypes
 * указать поддерживаемые типы дашбордов (их ключи)
 */
export default class Components {
  static components = Object.freeze({
    [ComponentKeys.DOC_PREVIEW]: {
      path: './DocPreview',
      label: 'dashboard-settings.widget.preview',
      supportedDashboardTypes: [DashboardTypes.CASE_DETAILS]
    },
    [ComponentKeys.JOURNAL]: {
      path: './Journals/JournalsDashlet/JournalsDashlet',
      label: 'dashboard-settings.widget.journal',
      supportedDashboardTypes: []
    },
    [ComponentKeys.COMMENTS]: {
      path: './Comments',
      label: 'dashboard-settings.widget.comments',
      supportedDashboardTypes: [DashboardTypes.CASE_DETAILS]
    },
    [ComponentKeys.PROPERTIES]: {
      path: './Properties',
      label: 'dashboard-settings.widget.properties',
      supportedDashboardTypes: [DashboardTypes.CASE_DETAILS, DashboardTypes.PROFILE]
    },
    [ComponentKeys.TASKS]: {
      path: './Tasks',
      label: 'dashboard-settings.widget.tasks',
      supportedDashboardTypes: [DashboardTypes.CASE_DETAILS]
    },
    [ComponentKeys.CURRENT_TASKS]: {
      path: './CurrentTasks',
      label: 'dashboard-settings.widget.current-tasks',
      supportedDashboardTypes: [DashboardTypes.CASE_DETAILS]
    },
    [ComponentKeys.DOC_STATUS]: {
      path: './DocStatus',
      label: 'dashboard-settings.widget.doc-status',
      supportedDashboardTypes: [DashboardTypes.CASE_DETAILS]
    },
    [ComponentKeys.EVENTS_HISTORY]: {
      path: './EventsHistory',
      label: 'dashboard-settings.widget.events-history',
      supportedDashboardTypes: [DashboardTypes.CASE_DETAILS]
    },
    [ComponentKeys.VERSIONS_JOURNAL]: {
      path: './VersionsJournal',
      label: 'dashboard-settings.widget.versions-journal',
      supportedDashboardTypes: [DashboardTypes.CASE_DETAILS]
    },
    [ComponentKeys.DOC_ASSOCIATIONS]: {
      path: './DocAssociations',
      label: 'dashboard-settings.widget.doc-associations',
      supportedDashboardTypes: [DashboardTypes.CASE_DETAILS]
    },
    [ComponentKeys.RECORD_ACTIONS]: {
      path: './Actions',
      label: 'dashboard-settings.widget.actions',
      supportedDashboardTypes: []
    },
    [ComponentKeys.WEB_PAGE]: {
      path: './WebPage',
      label: 'dashboard-settings.widget.web-page',
      supportedDashboardTypes: []
    },
    [ComponentKeys.BIRTHDAYS]: {
      path: './Birthdays',
      label: 'dashboard-settings.widget.birthdays',
      supportedDashboardTypes: [DashboardTypes.USER]
    },
    [ComponentKeys.BARCODE]: {
      path: './Barcode',
      label: 'dashboard-settings.widget.barcode',
      supportedDashboardTypes: [DashboardTypes.CASE_DETAILS]
    }
  });

  static allDashboardsComponents = [ComponentKeys.JOURNAL, ComponentKeys.RECORD_ACTIONS, ComponentKeys.WEB_PAGE];

  static get(component) {
    const link = get(Components.components, [component, 'path']);

    if (!link) {
      return () => null;
    }

    return loadable(() => import(`${link}`));
  }

  static getComponentsFullData(dashboardType = DashboardTypes.CASE_DETAILS) {
    const components = new Map();

    Components.getWidgetsForAllDasboards().forEach(component => {
      components.set(component.name, component.label);
    });

    Object.entries(Components.components).forEach(([name, component]) => {
      if (component.supportedDashboardTypes.includes(dashboardType)) {
        components.set(name, component.label);
      }
    });

    const arrComponents = [...components].map(([name, label]) => ({
      name,
      label
    }));

    components.clear();

    return deepClone(arrComponents);
  }

  static getWidgetsForAllDasboards() {
    return Components.allDashboardsComponents.map(key => ({ ...Components.components[key], name: key }));
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
