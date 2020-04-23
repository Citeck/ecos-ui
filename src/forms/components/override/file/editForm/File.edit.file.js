import FileEditFile from 'formiojs/components/file/editForm/File.edit.file';

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
        content: '<p>Enter custom javascript code. You must assign the <strong>disp</strong> variable.</p>'
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
          label: 'Open document page'
        },
        {
          value: FILE_CLICK_ACTION_DOWNLOAD,
          label: 'Download'
        },
        {
          value: FILE_CLICK_ACTION_NOOP,
          label: 'No action'
        }
      ]
    }
  },
  ...FileEditFile
];
