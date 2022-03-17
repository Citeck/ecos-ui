import BaseEditForm from 'formiojs/components/base/Base.form';
import TextAreaDisplay from 'formiojs/components/textarea/editForm/TextArea.edit.display';

const wysiwyg = TextAreaDisplay.find(el => el.key === 'wysiwyg');

export default function(...extend) {
  return BaseEditForm(
    [
      {
        key: 'display',
        components: [
          ...TextAreaDisplay,
          {
            ...wysiwyg,
            description: 'Enter the WYSIWYG editor JSON configuration.'
          },
          {
            key: 'configHelpInfo',
            tag: 'p',
            content:
              '<details>\n  <summary><b>Configuration Help Info</b></summary>\n  <ul>\n    <li>Enter configuration settings in the field above as <b>JSON</b></li>\n    <li><b>Different config</b> for every Editor. Define at first what prefer. See properties:</li>\n    <li><a href="https://ckeditor.com/docs/ckeditor5/latest/api/module_core_editor_editorconfig-EditorConfig.html">CKEditor</a></li>\n    <li><a href="https://quilljs.com/docs/configuration/">Quill</a></li>\n    <li><a href="https://github.com/ajaxorg/ace/wiki/Configuring-Ace">Ace</a></li>\n    <li>Be careful. Properties intersect with component\'s props and can be replaced or opposite...\n </li>\n  </ul>\n  <details>\n    <summary><b>Examples</b></summary>\n    <ul>\n      <li>\n        CKEditor\n      <code>{"toolbar": [ "bold", "italic"], "placeholder": "Type some text..."}</code>\n      </li>\n      <li>Quill\n      <code>{"modules": { "toolbar": [[\'bold\', \'italic\']] }, "placeholder": "Compose an epic..."}</code>\n      </li>\n      <li>Ace\n      <code>{"fontSize": 20, "readOnly": true}</code>\n      </li>\n    </ul>\n</details>\n</details>\n',
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
