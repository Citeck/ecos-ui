import BaseEditForm from 'formiojs/components/base/Base.form';
import TextAreaDisplay from 'formiojs/components/textarea/editForm/TextArea.edit.display';

import TextAreaEditAI from './editForm/TextArea.edit.ai';

import { t } from '@/helpers/export/util.ts';

const editor = TextAreaDisplay.find(el => el.key === 'editor');
const wysiwyg = TextAreaDisplay.find(el => el.key === 'wysiwyg');
const asField = TextAreaDisplay.find(el => el.key === 'as');

if (wysiwyg) {
  delete wysiwyg.tooltip;
  delete wysiwyg.customDefaultValue;
}

if (editor && editor.data && editor.data.values && editor.data.values.length) {
  editor.data.values.push({ label: 'Lexical', value: 'lexical' });
  editor.data.values.push({ label: 'Monaco', value: 'monaco' });
}

if (asField) {
  asField.conditional = {
    json: {
      or: [
        {
          '===': [
            {
              var: 'data.editor'
            },
            'quill'
          ]
        },
        {
          '===': [
            {
              var: 'data.editor'
            },
            'ace'
          ]
        },
        {
          '===': [
            {
              var: 'data.editor'
            },
            'monaco'
          ]
        }
      ]
    }
  };
}

const lexicalMaxLength = {
  type: 'number',
  get label() {
    return t('form-constructor.textarea.lexical-max-length.label');
  },
  get tooltip() {
    return t('form-constructor.textarea.lexical-max-length.tooltip');
  },
  key: 'lexicalMaxLength',
  weight: 416,
  clearOnHide: true,
  placeholder: '5000000',
  conditional: {
    json: { '===': [{ var: 'data.editor' }, 'lexical'] }
  }
};

const languageSelection = {
  type: 'select',
  get label() {
    return t('form-constructor.html.textarea.codeAs');
  },
  key: 'codeAs',
  weight: 415,
  data: {
    values: [
      { label: 'JavaScript', value: 'javascript' },
      { label: 'XML', value: 'xml' },
      { label: 'YAML', value: 'yaml' },
      { label: 'HTML', value: 'html' },
      { label: 'JSON', value: 'json' }
    ]
  },
  clearOnHide: true,
  conditional: {
    json: { '===': [{ var: 'data.editor' }, 'monaco'] }
  }
};

export default function (...extend) {
  return BaseEditForm(
    [
      {
        key: 'display',
        components: [
          ...TextAreaDisplay,
          {
            ...editor
          },
          languageSelection,
          lexicalMaxLength,
          {
            ...wysiwyg,
            description: 'Enter the WYSIWYG editor JSON configuration.',
            customDefaultValue: (value, component, row, data, instance) =>
              (instance && instance.wysiwygDefault) || (value.instance && value.instance.wysiwygDefault) || {}
          },
          {
            key: 'configHelpInfo',
            tag: 'p',
            get content() {
              return t('form-constructor.html.textarea.configuration');
            },
            type: 'htmlelement',
            input: false,
            weight: 418
          }
        ]
      },
      {
        label: 'AI',
        key: 'ai',
        weight: 100,
        components: TextAreaEditAI
      }
    ],
    ...extend
  );
}
