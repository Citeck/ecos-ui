import loadable from '@loadable/component';

export default class Components {
  static components(name) {
    switch (name) {
      case 'login':
        return './LoginForm';
      case 'doc-preview':
        return './DocPreview';
      default:
        return '';
    }
  }

  static get(component) {
    return loadable(() => import(`${Components.components(component)}`));
  }
}
