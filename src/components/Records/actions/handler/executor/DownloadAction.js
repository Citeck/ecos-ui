import ActionsExecutor from '../ActionsExecutor';
import { getDownloadContentUrl } from '../../../../../helpers/urls';
import isString from 'lodash/isString';

export default class DownloadAction extends ActionsExecutor {
  static ACTION_ID = 'download';

  async execForRecord(record, action, context) {
    const { config = {} } = action;
    const fileName = config.filename || config.fileName;

    if (config.downloadType === 'base64') {
      record.load(config.attribute || 'data', true).then(data => {
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
            const extPostfix = '.' + config.extension;
            if (!filename.endsWith(extPostfix)) {
              filename += extPostfix;
            }
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
          filename = filename.replace(/[^-a-zA-Z\d._]+/g, '_');

          if (!filename.endsWith('.json')) {
            filename += '.json';
          }
          DownloadAction._downloadText(JSON.stringify(data.json, null, '  '), filename, 'text/json');
        });
    } else if (config.downloadType === 'text') {
      const attribute = config.attribute || '?json';
      const extension = config.extension || 'json';

      record.load(attribute, true).then(data => {
        let name = fileName;
        if (!name) {
          name = record.id;
          let sourceIdDelimIdx = name.indexOf('@');
          if (sourceIdDelimIdx > 0 && sourceIdDelimIdx < name.length - 1) {
            name = name.substring(sourceIdDelimIdx + 1);
          }
        }
        name = name.replace(/[^-a-zA-Z\d._]+/g, '_') + '.' + extension;
        let value = data;
        if (!isString(value)) {
          value = JSON.stringify(value, null, '  ');
        }
        DownloadAction._downloadText(value, name, 'text/plain');
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
    DownloadAction._downloadDataStr(url, filename, { target: '_blank' });
  }

  static _downloadBase64(base64, filename) {
    const dataStr = 'data:application/octet-stream;charset=utf-8;base64,' + base64;
    DownloadAction._downloadDataStr(dataStr, filename);
  }

  static _downloadText(text, filename, mimetype) {
    const dataStr = 'data:' + mimetype + ';charset=utf-8,' + encodeURIComponent(text);
    DownloadAction._downloadDataStr(dataStr, filename);
  }

  static _downloadDataStr(dataStr, filename, options = {}) {
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute('href', dataStr);
    downloadAnchorNode.setAttribute('download', filename);
    downloadAnchorNode.setAttribute('data-external', true);

    for (let key in options) {
      if (options.hasOwnProperty(key)) {
        downloadAnchorNode.setAttribute(key, options[key]);
      }
    }

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
