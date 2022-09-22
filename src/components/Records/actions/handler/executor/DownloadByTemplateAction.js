import Records from '../../../Records';
import DownloadAction from './DownloadAction';

export default class DownloadByTemplateAction extends DownloadAction {
  static ACTION_ID = 'download-by-template';

  async execForRecord(record, action, context) {
    let { templateRef, resultName, requestParams = {} } = action.config;

    if (!resultName) {
      resultName = await record.load('?disp');
    }

    const model = await Records.get(templateRef).load('model?json');

    const fillTemplateRec = Records.get('transformations/fill-template@');
    for (let key in requestParams) {
      fillTemplateRec[key] = requestParams[key];
    }
    fillTemplateRec.att('templateRef', templateRef);
    fillTemplateRec.att('resultName', resultName);
    fillTemplateRec.att('model', await record.load(model, true));

    const result = await fillTemplateRec.save(['content', 'name']);
    const dataStr = 'data:application/octet-stream;charset=utf-8;base64,' + encodeURIComponent(result.content);

    DownloadAction._downloadDataStr(dataStr, result.name);

    return false;
  }

  getDefaultActionModel() {
    return {
      name: 'record-action.name.' + DownloadByTemplateAction.ACTION_ID,
      icon: 'icon-download'
    };
  }
}
