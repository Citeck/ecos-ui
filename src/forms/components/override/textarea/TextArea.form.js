import BaseEditForm from 'formiojs/components/base/Base.form';
import TextAreaDisplay from 'formiojs/components/textarea/editForm/TextArea.edit.display';

import { t } from '../../../../helpers/export/util';

const editor = TextAreaDisplay.find(el => el.key === 'editor');
const wysiwyg = TextAreaDisplay.find(el => el.key === 'wysiwyg');
delete wysiwyg.tooltip;
delete wysiwyg.customDefaultValue;

if (editor && editor.data && editor.data.values && editor.data.values.length) {
  editor.data.values.push({
    label: 'Lexical',
    value: 'lexical'
  });
}

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
      }
    ],
    ...extend
  );
}
