import loadable from '@loadable/component';
import { path } from 'ramda';
import { t } from '../helpers/util';

export default class Components {
  static components = {
    login: {
      path: './LoginForm',
      label: 'Форма авторизации'
    },
    pagination: {
      path: './common/Pagination/Pagination',
      label: 'Пагинация'
    },
    'doc-preview': {
      path: './DocPreview',
      label: 'Предпросмотр'
    },
    journal: {
      path: './Journals/JournalsDashlet/JournalsDashlet',
      label: 'Журнал'
    }
  };

  static get(component) {
    const link = path([component, 'path'], Components.components);

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
