import FileEditFile from 'formiojs/components/file/editForm/File.edit.file';

import { t } from '../../../../../helpers/export/util';

export const FILE_CLICK_ACTION_DOWNLOAD = 'download';
export const FILE_CLICK_ACTION_OPEN_DASHBOARD = 'openDashboard';
export const FILE_CLICK_ACTION_NOOP = 'noop';

export default [
  {
    type: 'panel',
    title: 'Value display name',
    collapsible: true,
    collapsed: true,
    customClass: 'form-builder__panel-js',
    key: 'valueDisplayName-js',
    weight: 0,
    components: [
      {
        type: 'textarea',
        key: 'valueDisplayName',
        rows: 5,
        editor: 'ace',
        hideLabel: true,
        input: true
      },
      {
        type: 'htmlelement',
        tag: 'div',
        get content() {
          return t('form-constructor.panel.value-display-name');
        }
      }
    ]
  },
  {
    type: 'select',
    input: true,
    key: 'onFileClick',
    label: 'Behaviour on file item click',
    weight: 0,
    valueProperty: 'value',
    dataSrc: 'values',
    defaultValue: 'openDashboard',
    searchEnabled: false,
    data: {
      values: [
        {
          value: FILE_CLICK_ACTION_OPEN_DASHBOARD,
          get label() {
            return t('form-constructor.select.openDashboard');
          }
        },
        {
          value: FILE_CLICK_ACTION_DOWNLOAD,
          get label() {
            return t('form-constructor.select.download');
          }
        },
        {
          value: FILE_CLICK_ACTION_NOOP,
          get label() {
            return t('form-constructor.select.noop');
          }
        }
      ]
    }
  },
  ...FileEditFile
];

const storage = FileEditFile.find(item => item.key === 'storage');
console.log('STORAGE', storage);
