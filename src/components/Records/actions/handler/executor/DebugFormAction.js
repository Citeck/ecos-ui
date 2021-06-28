import get from 'lodash/get';
import set from 'lodash/set';

import { FORM_MODE_CREATE } from '../../../../EcosForm';
import ActionsExecutor from '../ActionsExecutor';
import { showForm } from '../../util/actionUtils';

export default class DebugFormAction extends ActionsExecutor {
  static ACTION_ID = 'debug-form';

  async execForRecord(record, action, context) {
    const { recordRef, parser = {} } = action.config || {};
    const options = get(action, 'config.options') || {};
    let className;

    if (!recordRef && !options.formMode) {
      options.formMode = FORM_MODE_CREATE;
    }

    if (parser.readViewMode) {
      options.readOnly = true;
      options.viewAsHtml = true;
    }

    if (parser.isDebugModeOn) {
      options.ecosIsDebugOn = parser.isDebugModeOn;
    }

    switch (parser.viewWidgetProperties) {
      case 'narrow':
        options.fullWidthColumns = true;
        set(options, 'viewAsHtmlConfig.hidePanels', true);
        className = 'ecos-modal_width-sm';
        break;
      case 'mobile':
        options.ecosIsMobile = true;
        className = 'ecos-modal_width-xs';
        break;
    }

    showForm(recordRef, { formId: record.id, options }, className);
  }

  getDefaultActionModel() {
    return {
      name: 'Debug Form'
    };
  }
}
