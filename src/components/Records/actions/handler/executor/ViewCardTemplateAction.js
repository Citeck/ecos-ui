import ActionsExecutor from '../ActionsExecutor';
import { getTimezoneValue } from '../../../../../helpers/util';
import { createPrintUrl } from '../../../../../helpers/urls';

export default class ViewCardTemplateAction extends ActionsExecutor {
  static ACTION_ID = 'view-card-template';

  async execForRecord(record, action, context) {
    const { config = {} } = action;

    const timezoneConfig = config.includeTimezone || config.includeTimezone == null ? getTimezoneValue() : {};
    const url = createPrintUrl({ record, config: { ...config, ...timezoneConfig } });

    window.open(url, '_blank');
  }

  getDefaultActionModel() {
    return {
      name: 'record-action.name.view-card-template-in-background',
      icon: 'icon-new-tab'
    };
  }
}
