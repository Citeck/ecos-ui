import _ from 'lodash';
import NativePromise from 'native-promise-only';
import Formio from 'formiojs/Formio';
import FormIOTextAreaComponent from 'formiojs/components/textarea/TextArea';
import { overrideTriggerChange } from '../misc';

export default class TextAreaComponent extends FormIOTextAreaComponent {
  static schema(...extend) {
    return FormIOTextAreaComponent.schema(
      {
        autoExpand: false,
        isUploadEnabled: false,
        showWordCount: false,
        showCharCount: false,
        inputFormat: 'plain'
      },
      ...extend
    );
  }

  setValue(value, flags) {
    const skipSetting = _.isEqual(value, this.getValue());
    value = value || '';
    if (this.options.readOnly || this.htmlView) {
      // For readOnly, just view the contents.
      if (this.input) {
        if (Array.isArray(value)) {
          value = value.join('<br/><br/>');
        }
        this.input.innerHTML = this.interpolate(value);
      }
      // Cause: ECOSUI-675 - Group list is not loaded in user info
      const changed = value !== undefined ? this.hasChanged(value, this.dataValue) : false;
      this.dataValue = value;
      return changed;
    } else if (this.isPlain) {
      value = Array.isArray(value) ? value.map(val => this.setConvertedValue(val)) : this.setConvertedValue(value);
      return super.setValue(value, flags);
    }

    // Set the value when the editor is ready.
    this.dataValue = value;

    this.setWysiwygValue(value, skipSetting, flags);
    return this.updateValue(flags); // Cause: ECOSUI-675 - Group list is not loaded in user info
  }

  get defaultSchema() {
    return TextAreaComponent.schema();
  }

  constructor(...args) {
    super(...args);

    overrideTriggerChange.call(this);
  }

  createViewOnlyElement() {
    this.element = super.createViewOnlyElement();

    if (!this.isPlain) {
      this.element.classList.add('dl-html');
    }

    return this.element;
  }

  createViewOnlyValue(container) {
    super.createViewOnlyValue(container);

    if (!this.isPlain) {
      this.valueElement.classList.add('dd-html');
    }
  }

  addCKE(element, settings, onChange) {
    settings = _.isEmpty(settings) ? {} : settings;
    settings.base64Upload = true;

    return new Promise(resolve => {
      window.require(['/js/lib/ckeditor5-build-classic/v12.2.0-formio.2/ckeditor.js'], ckeditor => {
        if (!element.parentNode) {
          return NativePromise.reject();
        }
        return ckeditor.create(element, settings).then(editor => {
          editor.model.document.on('change', () => onChange(editor.data.get()));
          resolve(editor);
          return editor;
        });
      });
    });
  }

  addQuill(element, settings, onChange) {
    settings = _.isEmpty(settings) ? this.wysiwygDefault : settings;

    // Lazy load the quill css.
    Formio.requireLibrary(
      `quill-css-${settings.theme}`,
      'Quill',
      [{ type: 'styles', src: `https://cdn.quilljs.com/1.3.6/quill.${settings.theme}.css` }],
      true
    );

    return new Promise(resolve => {
      window.require(['/js/lib/quill/1.3.6/quill.js'], Quill => {
        if (!element.parentNode) {
          return NativePromise.reject();
        }
        this.quill = new Quill(element, settings);

        /** This block of code adds the [source] capabilities.  See https://codepen.io/anon/pen/ZyEjrQ **/
        const txtArea = document.createElement('textarea');
        txtArea.setAttribute('class', 'quill-source-code');
        this.quill.addContainer('ql-custom').appendChild(txtArea);
        const qlSource = element.parentNode.querySelector('.ql-source');
        if (qlSource) {
          this.addEventListener(qlSource, 'click', event => {
            event.preventDefault();
            if (txtArea.style.display === 'inherit') {
              this.quill.setContents(this.quill.clipboard.convert(txtArea.value));
            }
            txtArea.style.display = txtArea.style.display === 'none' ? 'inherit' : 'none';
          });
        }
        /** END CODEBLOCK **/

        // Make sure to select cursor when they click on the element.
        this.addEventListener(element, 'click', () => this.quill.focus());

        // Allows users to skip toolbar items when tabbing though form
        const elm = document.querySelectorAll('.ql-formats > button');
        for (let i = 0; i < elm.length; i++) {
          elm[i].setAttribute('tabindex', '-1');
        }

        this.quill.on('text-change', () => {
          txtArea.value = this.quill.root.innerHTML;
          onChange(txtArea);
        });

        resolve(this.quill);
        return this.quill;
      });
    });
  }

  addAce(element) {
    window.require(['/js/lib/ace/1.4.1/ace.js'], () => {
      const mode = this.component.as || 'javascript';
      this.editor = window.ace.edit(element);

      this.editor.on('change', () => this.updateEditorValue(this.editor.getValue()));
      this.editor.getSession().setTabSize(2);
      this.editor.getSession().setMode(`ace/mode/${mode}`);
      this.editor.on('input', () => this.acePlaceholder());
      setTimeout(() => this.acePlaceholder(), 100);
      this.editorReadyResolve(this.editor);
      return this.editor;
    });
  }

  enableWysiwyg() {
    if (this.isPlain || this.options.readOnly || this.options.htmlView) {
      if (this.autoExpand) {
        this.element.childNodes.forEach(element => {
          if (element.nodeName === 'TEXTAREA') {
            this.addAutoExpanding(element);
          }
        });
      }

      return;
    }

    if (this.component.editor === 'ace') {
      this.addAce(this.input);
      return this.input;
    }

    if (this.component.editor === 'ckeditor') {
      const settings = this.component.wysiwyg || {};
      settings.rows = this.component.rows;
      this.addCKE(this.input, settings, newValue => this.updateEditorValue(newValue)).then(editor => {
        this.editor = editor;
        if (this.options.readOnly || this.component.disabled) {
          this.editor.isReadOnly = true;
        }
        this.editorReadyResolve(this.editor);
        return editor;
      });
      return this.input;
    }

    // Normalize the configurations.
    if (
      this.component.wysiwyg &&
      (this.component.wysiwyg.hasOwnProperty('toolbarGroups') || this.component.wysiwyg.hasOwnProperty('toolbar'))
    ) {
      console.warn(
        'The WYSIWYG settings are configured for CKEditor. For this renderer, you will need to use configurations for the Quill Editor. See https://quilljs.com/docs/configuration for more information.'
      );
      this.component.wysiwyg = this.wysiwygDefault;
      this.emit('componentEdit', this);
    }
    if (!this.component.wysiwyg || typeof this.component.wysiwyg === 'boolean') {
      this.component.wysiwyg = this.wysiwygDefault;
      this.emit('componentEdit', this);
    }

    // Add the quill editor.
    this.addQuill(this.input, this.component.wysiwyg, () => this.updateEditorValue(this.quill.root.innerHTML))
      .then(quill => {
        if (this.component.isUploadEnabled) {
          const _this = this;
          quill.getModule('toolbar').addHandler('image', function() {
            //we need initial 'this' because quill calls this method with its own context and we need some inner quill methods exposed in it
            //we also need current component instance as we use some fields and methods from it as well
            _this.imageHandler.call(_this, this);
          });
        }
        quill.root.spellcheck = this.component.spellcheck;
        if (this.options.readOnly || this.component.disabled) {
          quill.disable();
        }

        this.editorReadyResolve(quill);
        return quill;
      })
      .catch(err => console.warn(err));
  }

  refreshWysiwyg() {
    this.editorReady = new Promise(resolve => {
      this.editorReadyResolve = resolve;
    });

    this.enableWysiwyg();
    this.setWysiwygValue(this.dataValue);
    this.wysiwygRendered = true;
  }

  prepareToInlineEditMode() {
    this.refreshWysiwyg();
  }

  cleanAfterInlineEditMode() {
    if (this.wysiwygRendered) {
      this.destroyWysiwyg();
      this.wysiwygRendered = false;
      this.editorReady = null;
    }
  }

  show(show, noClear) {
    // Cause: https://citeck.atlassian.net/browse/ECOSUI-89
    if (show && this.wysiwygRendered && this.editorReady) {
      this.editorReady.then(editor => {
        let parentNode = null;
        if (this.component.editor === 'ckeditor') {
          parentNode = _.get(editor, 'sourceElement.parentNode');
        } else {
          parentNode = _.get(editor, 'container.parentNode');
        }

        if (!parentNode) {
          this.refreshWysiwyg();
        }
      });
    }

    return super.show(show, noClear);
  }
}
