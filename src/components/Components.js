import loadable from '@loadable/component';
import get from 'lodash/get';
import { deepClone, t } from '../helpers/util';
import { isArray, isEmpty } from 'lodash';
import uuidV4 from 'uuid/v4';

export const ComponentKeys = {
  LOGIN: 'login',
  PAGINATION: 'pagination',
  DOC_PREVIEW: 'doc-preview',
  JOURNAL: 'journal',
  COMMENTS: 'comments',
  PROPERTIES: 'properties',
  TASKS: 'tasks',
  CURRENT_TASKS: 'current-tasks'
};

export default class Components {
  static components = {
    [ComponentKeys.DOC_PREVIEW]: {
      path: './DocPreview',
      label: 'dashboard-settings.widget.preview'
    },
    [ComponentKeys.JOURNAL]: {
      path: './Journals/JournalsDashlet/JournalsDashlet',
      label: 'dashboard-settings.widget.journal'
    },
    [ComponentKeys.COMMENTS]: {
      path: './Comments',
      label: 'dashboard-settings.widget.comments'
    },
    [ComponentKeys.PROPERTIES]: {
      path: './Properties',
      label: 'dashboard-settings.widget.properties'
    },
    [ComponentKeys.TASKS]: {
      path: './Tasks',
      label: 'dashboard-settings.widget.tasks'
    },
    [ComponentKeys.CURRENT_TASKS]: {
      path: './CurrentTasks',
      label: 'Текущие задачи'
    }
  };

  static get(component) {
    const link = get(Components.components, [component, 'path']);

    if (!link) {
      return () => null;
    }

    return loadable(() => import(`${link}`));
  }

  static getComponentsFullData() {
    const arrComponents = [];

    for (let name in Components.components) {
      arrComponents.push({
        name,
        label: t(Components.components[name].label)
      });
    }

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
            ...config,
            height: config.height || '500px'
          }
        };

        switch (defWidget.name) {
          case ComponentKeys.DOC_PREVIEW: {
            defWidget.props.config.link = config.link || '/share/proxy/alfresco/demo.pdf';
            defWidget.props.config.scale = config.scale || 1;
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
