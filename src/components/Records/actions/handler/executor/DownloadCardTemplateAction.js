import { createPrintUrl } from '../../../../../helpers/urls';
import DownloadAction from './DownloadAction';

export default class DownloadCardTemplateAction extends DownloadAction {
  static ACTION_ID = 'download-card-template';

  async execForRecord(record, action, context) {
    const { config } = action;
    const url = createPrintUrl({ record, config });

    const downloadAction = {
      ...action,
      config: {
        url,
        filename: 'template.' + config.format
      }
    };
    return super.execForRecord(record, downloadAction, context);
  }
}
