import ActionsExecutor from '../../ActionsExecutor';

export default class CaseRedirectAction extends ActionsExecutor {
  static ACTION_ID = 'REDIRECT';

  async execForRecord(record, action, context) {
    const {
      config: { url = '', target = '_self' }
    } = action;

    if (!url) {
      console.error(action);
      throw new Error('Redirect action url is missing!');
    }

    window.open(url, target);
  }

  getDefaultActionModel() {
    return {
      icon: 'icon-small-arrow-right'
    };
  }
}
