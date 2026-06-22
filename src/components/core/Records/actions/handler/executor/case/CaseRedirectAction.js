import ActionsExecutor from '../../ActionsExecutor';
import get from 'lodash/get';

const URL_CONTEXTS = {
  PAGECONTEXT: '/share/page/'
};

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

    let urlToOpen = url;
    const urlContext = URL_CONTEXTS[get(action, 'config.context', '')];
    if (urlContext) {
      urlToOpen = urlContext + urlToOpen;
    }

    window.open(urlToOpen, target);
  }

  getDefaultActionModel() {
    return {
      icon: 'icon-small-arrow-right'
    };
  }
}
