import ActionsExecutor from '../ActionsExecutor';

import PageService from '../../../../../services/PageService';

export default class OpenUrlAction extends ActionsExecutor {
  static ACTION_ID = 'open-url';

  async execForRecord(record, action, context) {
    const { config = {} } = action;
    //todo: this is not required. RecordActions service should replace it before call execForRecord. Check and remove it
    const url = config.url.replace('${recordRef}', record.id); // eslint-disable-line no-template-curly-in-string

    if (!url) {
      console.error(action);
      throw new Error('URL is a mandatory parameter! Record: ' + record.id + ' Action: ' + action.id);
    }

    if (config.withinEcosTab === true) {
      PageService.changeUrlLink(url, {
        openNewTab: config.openNewTab === true || (!config.target || config.target === '_blank')
      });
    } else {
      window.open(url, config.target || '_blank');
    }
  }

  getDefaultActionModel() {
    return {
      icon: 'icon-new-tab'
    };
  }
}
