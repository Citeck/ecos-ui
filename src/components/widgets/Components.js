import { lazy } from 'react';
import get from 'lodash/get';
import isArray from 'lodash/isArray';
import isEmpty from 'lodash/isEmpty';
import uuidV4 from 'uuid/v4';
import { deepClone } from '../../helpers/util';
import { DashboardTypes } from '../../constants/dashboard';

export const ComponentKeys = {
  PAGINATION: 'pagination',
  DOC_PREVIEW: 'doc-preview',
  JOURNAL: 'journal',
  REPORT: 'report',
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
  BARCODE: 'barcode',
  BIRTHDAYS: 'birthdays',
  DOCUMENTS: 'documents',
  USER_PROFILE: 'user-profile',
  DOC_CONSTRUCTOR: 'doc-constructor'
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
   * @props: - общие параметры виджета:
   * maxHeightByContent (bool) - высота виджета по контенту
   * fixedHeight (bool) - фиксированная макимальнодоступная высота виджета вне зависимости от высоты контента
   */
  static components = Object.freeze({
    [ComponentKeys.DOC_PREVIEW]: {
      load: () => lazy(() => import('./DocPreview')),
      label: 'dashboard-settings.widget.preview',
      supportedDashboardTypes: [DashboardTypes.CASE_DETAILS],
      props: {
        fixedHeight: true
      }
    },
    [ComponentKeys.JOURNAL]: {
      load: () => lazy(() => import('./JournalsDashlet/JournalsDashlet')),
      label: 'dashboard-settings.widget.journal',
      supportedDashboardTypes: [],
      props: {}
    },
    [ComponentKeys.REPORT]: {
      load: () => lazy(() => import('./Report')),
      label: 'dashboard-settings.widget.report',
      supportedDashboardTypes: [DashboardTypes.USER],
      props: {}
    },
    [ComponentKeys.COMMENTS]: {
      load: () => lazy(() => import('./Comments')),
      label: 'dashboard-settings.widget.comments',
      supportedDashboardTypes: [DashboardTypes.CASE_DETAILS],
      props: {}
    },
    [ComponentKeys.PROPERTIES]: {
      load: () => lazy(() => import('./Properties')),
      label: 'dashboard-settings.widget.properties',
      supportedDashboardTypes: [DashboardTypes.CASE_DETAILS, DashboardTypes.PROFILE],
      props: {
        maxHeightByContent: true
      }
    },
    [ComponentKeys.TASKS]: {
      load: () => lazy(() => import('./Tasks')),
      label: 'dashboard-settings.widget.tasks',
      supportedDashboardTypes: [DashboardTypes.CASE_DETAILS],
      props: {}
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
      supportedDashboardTypes: [DashboardTypes.CASE_DETAILS],
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
      supportedDashboardTypes: Components.getAllDashboardTypesExcept([DashboardTypes.USER]),
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
      supportedDashboardTypes: [DashboardTypes.USER],
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
      supportedDashboardTypes: [DashboardTypes.CASE_DETAILS, DashboardTypes.PROFILE],
      props: {}
    },
    [ComponentKeys.USER_PROFILE]: {
      load: () => lazy(() => import('./UserProfile')),
      label: 'dashboard-settings.widget.user-basic-info',
      supportedDashboardTypes: [DashboardTypes.PROFILE],
      props: {}
    },
    [ComponentKeys.DOC_CONSTRUCTOR]: {
      load: () => lazy(() => import('./DocConstructor')),
      label: 'dashboard-settings.widget.doc-constructor',
      supportedDashboardTypes: [DashboardTypes.CASE_DETAILS],
      props: {}
    }
  });

  static allDashboardsComponents = [ComponentKeys.JOURNAL, ComponentKeys.WEB_PAGE];

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

  static getProps(component) {
    return get(Components.components, [component, 'props'], {});
  }

  static getComponentsFullData(dashboardType = DashboardTypes.CASE_DETAILS) {
    const components = new Map();

    Components.widgetsForAllDasboards.forEach(component => {
      components.set(component.name, component.label);
    });

    Object.entries(Components.components).forEach(([name, component]) => {
      if (component.supportedDashboardTypes && component.supportedDashboardTypes.includes(dashboardType)) {
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

  static getDefaultWidget = widget => {
    const defWidget = deepClone(widget);
    const props = widget.props || {};
    const config = props.config || {};

    defWidget.id = widget.id || uuidV4();
    defWidget.props = {
      ...props,
      id: props.id || defWidget.id,
      config: {
        widgetDisplayCondition: '',
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
}
