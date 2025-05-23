import cloneDeep from 'lodash/cloneDeep';
import get from 'lodash/get';
import isArray from 'lodash/isArray';
import isEmpty from 'lodash/isEmpty';
import isFunction from 'lodash/isFunction';
import isString from 'lodash/isString';
import { lazy } from 'react';
import uuidV4 from 'uuid/v4';

import { CONFIG_VERSION, DashboardTypes } from '../../constants/dashboard';
import { getCurrentLocale, getEnabledWorkspaces, t } from '../../helpers/util';
import ConfigService, { ALFRESCO_ENABLED } from '../../services/config/ConfigService';
import { FORM_MODE_EDIT, FORM_MODE_VIEW } from '../EcosForm';

import { getWorkspaceId } from '@/helpers/urls';

export const ComponentKeys = {
  WELCOME: 'welcome',
  NEWS: 'news',
  HTML: 'html',
  PAGINATION: 'pagination',
  DOC_PREVIEW: 'doc-preview',
  JOURNAL: 'journal',
  REPORT: 'report',
  COMMENTS: 'comments',
  ACTIVITIES: 'activities',
  PROPERTIES: 'properties',
  TASKS: 'tasks',
  CURRENT_TASKS: 'current-tasks',
  DOC_STATUS: 'doc-status',
  EVENTS_HISTORY: 'events-history',
  VERSIONS_JOURNAL: 'versions-journal',
  DOC_ASSOCIATIONS: 'doc-associations',
  RECORD_ACTIONS: 'record-actions',
  WEB_PAGE: 'web-page',
  BARCODE: 'barcode',
  BIRTHDAYS: 'birthdays',
  DOCUMENTS: 'documents',
  USER_PROFILE: 'user-profile',
  DOC_CONSTRUCTOR: 'doc-constructor',
  PROCESS_STATISTICS: 'process-statistics',
  STAGES: 'stages',
  CHARTS: 'charts',
  PUBLICATION: 'publication',
  HIERARCHICAL_TREE: 'hierarchical-tree',
  KANBAN_BOARD: 'kanban-board'
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
 *
 * С помощью Components.getAllDashboardTypesExcept в поле supportedDashboardTypes
 * можно указать типы дашбордов, на которых не следует отображать виджет
 */
export default class Components {
  /**
   * @props {Object} - general widget options:
   * maxHeightByContent (bool) - content widget height
   * fixedHeight (bool) - fixed maximum available widget height regardless of content height
   * @load {Function} - widget loading function using lazy
   * @settings {Function} - function to load widget settings (required for modal dashboard settings window)
   * @checkIsAvailable {Function} - a function that returns a boolean value (widget available or not)
   * @supportedDashboardTypes {Array} - types of dashboards where this widget is available. If empty - available everywhere
   */
  static components = Object.freeze({
    [ComponentKeys.WELCOME]: {
      load: () =>
        lazy(() =>
          import('../../plugins').then(plugins => ({
            default: get(plugins, 'default.WelcomeWidget', () => null)
          }))
        ),
      checkIsAvailable: () => {
        const workspacesEnabled = getEnabledWorkspaces();

        if (!workspacesEnabled) {
          return false;
        }

        return Boolean(get(window, 'Citeck.Plugins.WelcomeWidget'));
      },
      label: 'dashboard-settings.widget.welcome',
      supportedDashboardTypes: [DashboardTypes.USER, DashboardTypes.CUSTOM]
    },
    [ComponentKeys.NEWS]: {
      load: () =>
        lazy(() =>
          import('../../plugins').then(plugins => ({
            default: get(plugins, 'default.NewsWidget', () => null)
          }))
        ),
      label: 'dashboard-settings.widget.news',
      supportedDashboardTypes: [DashboardTypes.USER, DashboardTypes.CUSTOM]
    },
    [ComponentKeys.DOC_PREVIEW]: {
      load: () => lazy(() => import('./DocPreview')),
      label: 'dashboard-settings.widget.preview',
      supportedDashboardTypes: [DashboardTypes.CASE_DETAILS],
      props: {
        fixedHeight: true,
        config: {
          showAllDocuments: false
        }
      }
    },
    [ComponentKeys.JOURNAL]: {
      load: () => lazy(() => import('./JournalsDashlet/JournalsDashlet')),
      label: 'dashboard-settings.widget.journal',
      supportedDashboardTypes: [],
      props: {},
      settings: () => lazy(() => import('./JournalsDashlet/Settings'))
    },
    [ComponentKeys.HTML]: {
      load: () => lazy(() => import('./HTML/Widget')),
      label: 'HTML',
      supportedDashboardTypes: [],
      props: {}
    },
    [ComponentKeys.REPORT]: {
      load: () => lazy(() => import('./Report')),
      label: 'dashboard-settings.widget.report',
      supportedDashboardTypes: [DashboardTypes.USER, DashboardTypes.CUSTOM],
      checkIsAvailable: async () => await ConfigService.getValue(ALFRESCO_ENABLED),
      props: {}
    },
    [ComponentKeys.COMMENTS]: {
      load: () => lazy(() => import('./Comments')),
      label: 'dashboard-settings.widget.comments',
      supportedDashboardTypes: [DashboardTypes.CASE_DETAILS],
      props: {
        dataStorageFormat: 'html'
      }
    },
    [ComponentKeys.PROPERTIES]: {
      load: () => lazy(() => import('./Properties')),
      label: 'dashboard-settings.widget.properties',
      supportedDashboardTypes: [DashboardTypes.CASE_DETAILS, DashboardTypes.PROFILE],
      props: {
        maxHeightByContent: true,
        view: {
          options: [
            { value: FORM_MODE_VIEW, label: 'widget-settings.form-condition.view' },
            { value: FORM_MODE_EDIT, label: 'widget-settings.form-condition.edit' }
          ],
          default: FORM_MODE_VIEW
        }
      }
    },
    [ComponentKeys.TASKS]: {
      load: () => lazy(() => import('./Tasks')),
      label: 'dashboard-settings.widget.tasks',
      supportedDashboardTypes: [DashboardTypes.CASE_DETAILS],
      props: {
        maxHeightByContent: true
      }
    },
    [ComponentKeys.CURRENT_TASKS]: {
      load: () => lazy(() => import('./CurrentTasks')),
      label: 'dashboard-settings.widget.current-tasks',
      supportedDashboardTypes: [DashboardTypes.CASE_DETAILS],
      props: {
        maxHeightByContent: true
      }
    },
    [ComponentKeys.DOC_STATUS]: {
      load: () => lazy(() => import('./DocStatus')),
      label: 'dashboard-settings.widget.doc-status',
      supportedDashboardTypes: [DashboardTypes.CASE_DETAILS],
      props: {}
    },
    [ComponentKeys.EVENTS_HISTORY]: {
      load: () => lazy(() => import('./EventsHistory')),
      label: 'dashboard-settings.widget.events-history',
      supportedDashboardTypes: [DashboardTypes.CASE_DETAILS, DashboardTypes.PROFILE],
      props: {}
    },
    [ComponentKeys.VERSIONS_JOURNAL]: {
      load: () => lazy(() => import('./VersionsJournal')),
      label: 'dashboard-settings.widget.versions-journal',
      supportedDashboardTypes: [DashboardTypes.CASE_DETAILS],
      props: {}
    },
    [ComponentKeys.DOC_ASSOCIATIONS]: {
      load: () => lazy(() => import('./DocAssociations')),
      label: 'dashboard-settings.widget.doc-associations',
      supportedDashboardTypes: [DashboardTypes.CASE_DETAILS],
      props: {}
    },
    [ComponentKeys.RECORD_ACTIONS]: {
      load: () => lazy(() => import('./Actions')),
      label: 'dashboard-settings.widget.actions',
      supportedDashboardTypes: Components.getAllDashboardTypesExcept([DashboardTypes.USER, DashboardTypes.CUSTOM]),
      props: {}
    },
    [ComponentKeys.WEB_PAGE]: {
      load: () => lazy(() => import('./WebPage')),
      label: 'dashboard-settings.widget.web-page',
      supportedDashboardTypes: [],
      props: {}
    },
    [ComponentKeys.BIRTHDAYS]: {
      load: () => lazy(() => import('./Birthdays')),
      label: 'dashboard-settings.widget.birthdays',
      supportedDashboardTypes: [DashboardTypes.USER, DashboardTypes.CUSTOM],
      props: {}
    },
    [ComponentKeys.BARCODE]: {
      load: () => lazy(() => import('./Barcode')),
      label: 'dashboard-settings.widget.barcode',
      supportedDashboardTypes: [DashboardTypes.CASE_DETAILS],
      props: {}
    },
    [ComponentKeys.DOCUMENTS]: {
      load: () => lazy(() => import('./Documents')),
      label: 'dashboard-settings.widget.documents',
      supportedDashboardTypes: [DashboardTypes.CASE_DETAILS, DashboardTypes.PROFILE, DashboardTypes.ORGSTRUCTURE],
      props: {}
    },
    [ComponentKeys.USER_PROFILE]: {
      load: () => lazy(() => import('./UserProfile')),
      label: 'dashboard-settings.widget.user-basic-info',
      supportedDashboardTypes: [DashboardTypes.PROFILE, DashboardTypes.ORGSTRUCTURE],
      props: {}
    },
    [ComponentKeys.DOC_CONSTRUCTOR]: {
      load: () => lazy(() => import('./DocConstructor')),
      label: 'dashboard-settings.widget.doc-constructor',
      supportedDashboardTypes: [DashboardTypes.CASE_DETAILS],
      props: {}
    },
    [ComponentKeys.PROCESS_STATISTICS]: {
      load: () => lazy(() => import('./ProcessStatistics/Widget')),
      label: 'dashboard-settings.widget.process-statistics',
      supportedDashboardTypes: [DashboardTypes.CASE_DETAILS],
      props: {
        config: {
          showModelDefault: true,
          showHeatmapDefault: true,
          showJournalDefault: false,
          showCountersDefault: false
        }
      }
    },
    [ComponentKeys.ACTIVITIES]: {
      load: () =>
        lazy(() =>
          import('../../plugins').then(plugins => ({
            default: get(plugins, 'default.ActivitiesWidget', () => null)
          }))
        ),
      label: 'dashboard-settings.widget.activities',
      supportedDashboardTypes: [DashboardTypes.CASE_DETAILS, DashboardTypes.CUSTOM],
      checkIsAvailable: () => {
        const workspacesEnabled = getEnabledWorkspaces();

        if (!workspacesEnabled) {
          return false;
        }

        return Boolean(get(window, 'Citeck.Plugins.ActivitiesWidget'));
      },
      props: {
        dataStorageFormat: 'html'
      }
    },
    [ComponentKeys.KANBAN_BOARD]: {
      load: () =>
        lazy(() =>
          import('../../plugins').then(plugins => ({
            default: get(plugins, 'default.KanbanWidget', () => null)
          }))
        ),
      additionalProps: {
        isDragDisabledByLayout: layout =>
          layout &&
          (!layout.columns ||
            (layout.columns.length !== 1 && !layout.columns.find(column => Array.isArray(column) && column.length === 1))),
        isDropDisabledByColumn: column => Array.isArray(column) && column.length !== 1
      },
      label: 'dashboard-settings.widget.kanbanBoard',
      supportedDashboardTypes: [DashboardTypes.CASE_DETAILS]
    },
    [ComponentKeys.CHARTS]: {
      load: () =>
        lazy(() =>
          import('../../plugins').then(plugins => ({
            default: get(plugins, 'default.ChartsWidget', () => null)
          }))
        ),
      checkIsAvailable: () => Boolean(get(window, 'Citeck.Plugins.ChartsWidget')),
      label: 'dashboard-settings.widget.charts',
      supportedDashboardTypes: [DashboardTypes.CASE_DETAILS, DashboardTypes.USER, DashboardTypes.CUSTOM]
    },
    [ComponentKeys.PUBLICATION]: {
      load: () =>
        lazy(() =>
          import('../../plugins').then(plugins => ({
            default: get(plugins, 'default.PublicationWidget', () => null)
          }))
        ),
      additionalProps: {
        isDragDisabledByLayout: layout =>
          layout &&
          (!layout.columns || (layout.columns.length !== 1 && !layout.columns.find(column => Array.isArray(column) && column.length === 1)))
      },
      checkIsAvailable: () => {
        const workspacesEnabled = getEnabledWorkspaces();

        if (!workspacesEnabled) {
          return false;
        }

        return Boolean(get(window, 'Citeck.Plugins.PublicationWidget'));
      },
      label: 'dashboard-settings.widget.publication',
      supportedDashboardTypes: [DashboardTypes.PUBLICATION]
    },
    [ComponentKeys.HIERARCHICAL_TREE]: {
      load: () =>
        lazy(() =>
          import('../../plugins').then(plugins => ({
            default: get(plugins, 'default.HierarchicalTreeWidget', () => null)
          }))
        ),
      checkIsAvailable: () => {
        const workspacesEnabled = getEnabledWorkspaces();

        if (!workspacesEnabled) {
          return false;
        }

        return Boolean(get(window, 'Citeck.Plugins.HierarchicalTreeWidget'));
      },
      label: 'dashboard-settings.widget.hierarchical-tree',
      supportedDashboardTypes: [DashboardTypes.PUBLICATION, DashboardTypes.CUSTOM]
    },
    [ComponentKeys.STAGES]: {
      load: () =>
        lazy(() =>
          import('../../plugins').then(plugins => ({
            default: get(plugins, 'default.StagesWidget', () => null)
          }))
        ),
      settings: () =>
        lazy(() =>
          import('../../plugins').then(plugins => ({
            default: get(plugins, 'default.StagesWidgetSettings', () => null)
          }))
        ),
      checkIsAvailable: () => Boolean(get(window, 'Citeck.Plugins.StagesWidget')),
      label: 'dashboard-settings.widget.stages',
      supportedDashboardTypes: [DashboardTypes.CASE_DETAILS],
      props: {
        config: {
          [CONFIG_VERSION]: {
            fillPrevStages: true
          }
        }
      }
    }
  });

  static allDashboardsComponents = [ComponentKeys.NEWS, ComponentKeys.JOURNAL, ComponentKeys.WEB_PAGE, ComponentKeys.HTML];

  static get allDashboardTypes() {
    return Object.values(DashboardTypes);
  }

  static get widgetsForAllDasboards() {
    return Components.allDashboardsComponents.map(key => ({ ...Components.components[key], name: key }));
  }

  static get(component) {
    const loadComponent = get(Components.components, [component, 'load']);

    if (!loadComponent) {
      return () => null;
    }

    return loadComponent();
  }

  static settings(component) {
    const settingsComponent = get(Components.components, [component, 'settings']);

    if (!settingsComponent) {
      return () => null;
    }

    return settingsComponent();
  }

  static getProps(component) {
    return get(Components.components, [component, 'props'], {});
  }

  static async getComponentsFullData(dashboardType = DashboardTypes.CASE_DETAILS) {
    const components = new Map();

    Components.widgetsForAllDasboards.forEach(component => {
      components.set(component.name, { label: component.label, additionalProps: get(component, 'additionalProps', {}) });
    });

    await Promise.all(
      Object.entries(Components.components).map(async ([name, component]) => {
        if (isFunction(component.checkIsAvailable)) {
          const isAvaliable = await component.checkIsAvailable(dashboardType);
          if (!isAvaliable) {
            return;
          }
        }

        if (component.supportedDashboardTypes && component.supportedDashboardTypes.includes(dashboardType)) {
          components.set(name, { label: component.label, additionalProps: get(component, 'additionalProps', {}) });
        }
      })
    );

    const arrComponents = [...components].map(([name]) => {
      const component = components.get(name);

      return {
        name,
        label: get(component, 'label', ''),
        additionalProps: get(component, 'additionalProps', {})
      };
    });

    components.clear();

    return cloneDeep(arrComponents);
  }

  static getDefaultWidget = widget => {
    const defWidget = cloneDeep(widget);
    const props = widget.props || {};
    const config = props.config || {};

    defWidget.id = widget.id || uuidV4();
    defWidget.props = {
      ...props,
      id: props.id || defWidget.id,
      config: {
        widgetDisplayCondition: null,
        elementsDisplayCondition: {},
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
  };

  static setDefaultPropsOfWidgets(items) {
    if (!isArray(items) || isEmpty(items)) {
      return [];
    }

    return items.map(item => {
      if (Array.isArray(item)) {
        return item.map(Components.getDefaultWidget);
      }

      return Components.getDefaultWidget(item);
    });
  }

  static getAllDashboardTypesExcept(types = []) {
    return Components.allDashboardTypes.filter(item => !types.includes(item));
  }

  static getWidgetLabel(widget, isMobile) {
    const description = get(widget, 'description', '');
    const descriptionDisp = isString(description) ? description : description[getCurrentLocale()];
    let label = t(get(Components.components, [widget.name, 'label'], get(widget, 'label', '')));

    if (isMobile && description) {
      label = `[${descriptionDisp}] ${label}`;
      return label;
    }

    return label;
  }
}
