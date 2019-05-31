import loadable from '@loadable/component';

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
}
