import loadable from '@loadable/component';
import get from 'lodash/get';
import { t } from '../helpers/util';

export const ComponentKeys = {
  LOGIN: 'login',
  PAGINATION: 'pagination',
  DOC_PREVIEW: 'doc-preview',
  JOURNAL: 'journal'
};

export default class Components {
  static components = {
    [ComponentKeys.LOGIN]: {
      path: './LoginForm',
      label: 'Форма авторизации'
    },
    [ComponentKeys.PAGINATION]: {
      path: './common/Pagination/Pagination',
      label: 'Пагинация'
    },
    [ComponentKeys.DOC_PREVIEW]: {
      path: './DocPreview',
      label: 'Предпросмотр'
    },
    [ComponentKeys.JOURNAL]: {
      path: './Journals/JournalsDashlet/JournalsDashlet',
      label: 'Журнал'
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
}
