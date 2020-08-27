import ActionsExecutor from '../ActionsExecutor';
import { getDownloadContentUrl } from '../../../../../helpers/urls';

export default class DownloadAction extends ActionsExecutor {
  static ACTION_ID = 'download';

  async execForRecord(record, action, context) {
    const { config = {} } = action;
    const fileName = config.filename || config.fileName;

    if (config.downloadType === 'base64') {
      record.load(config.attribute || 'data').then(data => {
        let filename = fileName;
        if (!filename) {
          filename = record.id;
          if (filename.indexOf('@') > 0) {
            filename = filename.substring(filename.indexOf('@') + 1);
          }
          if (filename.indexOf('$') > 0) {
            filename = filename.substring(filename.indexOf('$') + 1);
          }
          if (config.extension) {
            filename += '.' + config.extension;
          }
        }
        DownloadAction._downloadBase64(data, filename);
      });
    } else if (config.downloadType === 'ecos_module') {
      record
        .load(
          {
            title: 'title',
            name: 'name',
            module_id: 'module_id',
            moduleId: 'moduleId',
            json: '.json'
          },
          true
        )
        .then(data => {
          let filename = fileName || data.moduleId || data.module_id || data.title || data.name;
          filename = filename.replace(/[^a-zA-Zа-яА-Я0-9.]+/g, '_');

          if (!filename.endsWith('.json')) {
            filename += '.json';
          }
          DownloadAction._downloadText(JSON.stringify(data.json, null, '  '), filename, 'text/json');
        });
    } else {
      const name = fileName || 'file';
      DownloadAction._downloadByUrl(config.url, name, record);
    }

    return false;
  }

  static _downloadByUrl(url, filename, record) {
    url = url || getDownloadContentUrl(record.id);
    url = url.replace('${recordRef}', record.id); // eslint-disable-line no-template-curly-in-string

    const a = document.createElement('A', { target: '_blank' });

    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  static _downloadBase64(base64, filename) {
    const dataStr = 'data:application/octet-stream;charset=utf-8;base64,' + base64;
    DownloadAction._downloadDataStr(dataStr, filename);
  }

  static _downloadText(text, filename, mimetype) {
    const dataStr = 'data:' + mimetype + ';charset=utf-8,' + encodeURIComponent(text);
    DownloadAction._downloadDataStr(dataStr, filename);
  }

  static _downloadDataStr(dataStr, filename) {
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute('href', dataStr);
    downloadAnchorNode.setAttribute('download', filename);
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }

  getDefaultActionModel() {
    return {
      name: 'record-action.name.download',
      icon: 'icon-download'
    };
  }
}
