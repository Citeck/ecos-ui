import loadable from '@loadable/component';
import { t } from '../helpers/util';

export default class Components {
  static components = {
    login: './LoginForm',
    pagination: './common/Pagination/Pagination.jsx',
    'doc-preview': './DocPreview',
    journal: './Journals/JournalsDashlet/JournalsDashlet.jsx'
  };

  static get(component) {
    return loadable(() => import(`${Components.components[component]}`));
  }

  static getComponentsFullData() {
    const arrComponents = [];

    for (let name in Components.components) {
      arrComponents.push({
        name,
        label: t(name),
        isForArmin: false
      });
    }

    return arrComponents;
  }
}
