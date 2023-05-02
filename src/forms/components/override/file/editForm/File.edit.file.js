import BaseEditApi from 'formiojs/components/base/editForm/Base.edit.api';
import Formio from 'formiojs/Formio';
import map from 'lodash/map';
import set from 'lodash/set';

import { t } from '../../../../../helpers/export/util';
import { SourcesId } from '../../../../../constants';

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
  {
    type: 'select',
    input: true,
    key: 'storage',
    label: 'Storage',
    placeholder: 'Select your file storage provider',
    weight: 0,
    tooltip: 'Which storage to save the files in.',
    valueProperty: 'value',
    defaultValue: 'url',
    dataSrc: 'custom',
    data: {
      custom: function custom() {
        return map(Formio.providers.storage, function(storage, key) {
          return {
            label: storage.title,
            value: key
          };
        });
      }
    }
  },
  {
    type: 'textfield',
    input: true,
    key: 'url',
    label: 'Url',
    weight: 10,
    placeholder: 'Enter the url to post the files to.',
    tooltip:
      "See <a href='https://github.com/danialfarid/ng-file-upload#server-side' target='_blank'>https://github.com/danialfarid/ng-file-upload#server-side</a> for how to set up the server.",
    conditional: {
      json: {
        '===': [
          {
            var: 'data.storage'
          },
          'url'
        ]
      }
    }
  },
  {
    type: 'textarea',
    key: 'options',
    label: 'Custom request options',
    tooltip: 'Pass your custom xhr options(optional)',
    rows: 5,
    editor: 'ace',
    input: true,
    weight: 15,
    hidden: true,
    placeholder: '{\n      "withCredentials": true\n    }',
    conditional: {
      json: {
        '===': [
          {
            var: 'data.storage'
          },
          'url'
        ]
      }
    }
  },
  {
    type: 'textfield',
    input: true,
    key: 'dir',
    label: 'Directory',
    hidden: true,
    placeholder: '(optional) Enter a directory for the files',
    tooltip: 'This will place all the files uploaded in this field in the directory',
    weight: 20
  },
  {
    type: 'textfield',
    input: true,
    key: 'fileNameTemplate',
    hidden: true,
    label: 'File Name Template',
    tooltip:
      'Specify template for name of uploaded file(s). Regular template variables are available (`data`, `component`, `user`, `value`, `moment` etc.), also `fileName`, `guid` variables are available. `guid` part must be present, if not found in template, will be added at the end.',
    weight: 25
  },
  {
    type: 'checkbox',
    input: true,
    key: 'image',
    label: 'Display as image(s)',
    tooltip: 'Instead of a list of linked files, images will be rendered in the view.',
    weight: 30
  },
  {
    type: 'checkbox',
    input: true,
    key: 'privateDownload',
    label: 'Private Download',
    hidden: true,
    tooltip:
      'When this is checked, the file download will send a POST request to the download URL with the x-jwt-token header. This will allow your endpoint to create a Private download system.',
    weight: 31,
    conditional: {
      json: {
        '===': [
          {
            var: 'data.storage'
          },
          'url'
        ]
      }
    }
  },
  {
    type: 'textfield',
    input: true,
    key: 'imageSize',
    label: 'Image Size',
    placeholder: '100',
    tooltip: 'The image size for previewing images.',
    weight: 40,
    conditional: {
      json: {
        '==': [
          {
            var: 'data.image'
          },
          true
        ]
      }
    }
  },
  {
    type: 'checkbox',
    input: true,
    key: 'webcam',
    label: 'Enable web camera',
    tooltip: 'This will allow using an attached camera to directly take a picture instead of uploading an existing file.',
    weight: 32
  },
  {
    type: 'textfield',
    input: true,
    key: 'webcamSize',
    label: 'Webcam Width',
    placeholder: '320',
    tooltip: 'The webcam size for taking pictures.',
    weight: 38,
    conditional: {
      json: {
        '==': [
          {
            var: 'data.webcam'
          },
          true
        ]
      }
    }
  },
  {
    type: 'datagrid',
    input: true,
    label: 'File Types',
    key: 'fileTypes',
    tooltip:
      'Specify file types to classify the uploads. This is useful if you allow multiple types of uploads but want to allow the user to specify which type of file each is.',
    weight: 11,
    components: [
      {
        label: 'Label',
        key: 'label',
        input: true,
        type: 'textfield'
      },
      {
        label: 'Value',
        key: 'value',
        input: true,
        type: 'textfield'
      }
    ]
  },
  {
    type: 'textfield',
    input: true,
    key: 'filePattern',
    label: 'File Pattern',
    placeholder: '.pdf,.jpg',
    tooltip:
      "See <a href='https://github.com/danialfarid/ng-file-upload#full-reference' target='_blank'>https://github.com/danialfarid/ng-file-upload#full-reference</a> for how to specify file patterns.",
    weight: 50
  },
  {
    type: 'textfield',
    input: true,
    key: 'fileMinSize',
    label: 'File Minimum Size',
    placeholder: '1MB',
    tooltip:
      "See <a href='https://github.com/danialfarid/ng-file-upload#full-reference' target='_blank'>https://github.com/danialfarid/ng-file-upload#full-reference</a> for how to specify file sizes.",
    weight: 60
  },
  {
    type: 'textfield',
    input: true,
    key: 'fileMaxSize',
    label: 'File Maximum Size',
    placeholder: '10MB',
    tooltip:
      "See <a href='https://github.com/danialfarid/ng-file-upload#full-reference' target='_blank'>https://github.com/danialfarid/ng-file-upload#full-reference</a> for how to specify file sizes.",
    weight: 70
  }
];

const keyComponent = BaseEditApi.find(item => item.key === 'key');
set(keyComponent, 'isTypeahead', true);
set(
  keyComponent,
  'hintData.custom',
  `
  const getAttrs = (form) => {
    const parent = form.parentForm;
    const attrs = _.get(parent, 'data.modelAttributes');

    if (_.isUndefined(attrs) && parent) {
      return getAttrs(parent);
    }

    return attrs;
  };
  const formId = _.get(instance, 'root.editForm.formId', '');

  values = (getAttrs(instance.root) || []).map(item => item.id);

  if (formId && _.isEmpty(values)) {
    const formRef = '${SourcesId.RESOLVED_FORM}@' + formId;

    values = Citeck.Records.get(formRef).load('typeRef?id', true).then(async typeRef => {
      return await Citeck.Records.get(typeRef).load('model.attributes[]{id}');
    });
  }

  values = values.concat(['_content'])
`
);
