import get from 'lodash/get';
import merge from 'lodash/merge';
import cloneDeep from 'lodash/cloneDeep';
import isEqual from 'lodash/isEqual';
import isEmpty from 'lodash/isEmpty';
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

  constructor(...args) {
    super(...args);

    overrideTriggerChange.call(this);
  }

  get defaultSchema() {
    return TextAreaComponent.schema();
  }

  get isCkeEditor() {
    return this.component.editor === 'ckeditor';
  }

  get isQuillEditor() {
    return this.component.editor === 'quill';
  }

  get isAceEditor() {
    return this.component.editor === 'ace';
  }

  setValue(value, flags) {
    const skipSetting = isEqual(value, this.getValue());

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

  setupValueElement(element) {
    if (this.component.unreadable) {
      this.setUnreadableLabel(element);
      return;
    }

    let value = this.getValue();

    value = this.isEmpty(value) ? this.defaultViewOnlyValue : this.getView(value);

    if (this.component.wysiwyg) {
      value = this.interpolate(value);
    }

    element.textContent = value;
  }

  addCKE(element, settings, onChange) {
    settings = isEmpty(settings) ? {} : settings;
    settings.base64Upload = true;

    return new Promise(resolve => {
      window.require(['/js/lib/ckeditor5-build-classic/v12.2.0-formio.2/ckeditor.js'], ckeditor => {
        if (!get(element, 'parentNode')) {
          return NativePromise.reject();
        }

        return ckeditor.create(element, settings).then(editor => {
          editor.model.document.on('change', () => {
            if (!this._ckEditorInitialized) {
              this._ckEditorInitialized = true;
              return;
            }

            onChange(editor.data.get());
          });
          resolve(editor);
          return editor;
        });
      });
    }).catch(err => console.warn(err));
  }

  addQuill(element, settings, onChange) {
    const _settings = {};
    merge(_settings, this.wysiwygDefault);
    merge(_settings, settings);
    // Lazy load the quill css.
    Formio.requireLibrary(
      `quill-css-${_settings.theme}`,
      'Quill',
      [{ type: 'styles', src: `https://cdn.quilljs.com/1.3.6/quill.${_settings.theme}.css` }],
      true
    );

    return new Promise(resolve => {
      window.require(['/js/lib/quill/1.3.6/quill.js'], Quill => {
        if (!get(element, 'parentNode')) {
          return NativePromise.reject();
        }

        let quill = new Quill(element, _settings);

        /** This block of code adds the [source] capabilities.  See https://codepen.io/anon/pen/ZyEjrQ **/
        const txtArea = document.createElement('textarea');
        txtArea.setAttribute('class', 'quill-source-code');
        quill.addContainer('ql-custom').appendChild(txtArea);

        const qlSource = element.parentNode.querySelector('.ql-source');
        let onClickSource;
        if (qlSource) {
          onClickSource = event => {
            event.preventDefault();
            if (txtArea.style.display === 'inherit') {
              quill.setContents(quill.clipboard.convert(txtArea.value));
            }
            txtArea.style.display = txtArea.style.display === 'none' ? 'inherit' : 'none';
          };
          this.addEventListener(qlSource, 'click', onClickSource);
        }
        /** END CODEBLOCK **/

        // Make sure to select cursor when they click on the element.
        const onClickElm = () => quill && quill.focus();
        this.addEventListener(element, 'click', onClickElm);

        // Allows users to skip toolbar items when tabbing though form
        const buttons = document.querySelectorAll('.ql-formats > button');
        [...buttons].map(btn => btn.setAttribute('tabindex', '-1'));

        const onTextChange = () => {
          txtArea.value = get(quill, 'root.innerHTML');
          onChange(txtArea);
        };
        quill.on('text-change', onTextChange);

        //own destroy, bc it's removed in new version, bc https://quilljs.com/guides/upgrading-to-1-0/
        quill.destroy = () => {
          this.removeEventListener(qlSource, 'click', onClickSource);
          this.removeEventListener(element, 'click', onClickElm);
          quill && quill.off('text-change', onTextChange);
          quill = null;
        };

        resolve(quill);
        return quill;
      });
    });
  }

  addAce(element, settings, props) {
    try {
      window.require(['/js/lib/ace/1.4.1/ace.js', '/js/lib/ace/1.4.1/ext-searchbox.js'], () => {
        if (!element) {
          return NativePromise.reject();
        }

        const mode = this.component.as || 'javascript';
        this.editor = window.ace.edit(element);

        if (props.rows) {
          const height = (this.editor.getOption('fontSize') + 2) * props.rows;

          this.input.style.height = height + 'px';
        }

        this.editor.setOptions(settings);
        this.editor.on('change', () => this.updateEditorValue(this.editor.getValue()));
        this.editor.getSession().setTabSize(2);
        this.editor.getSession().setMode(`ace/mode/${mode}`);
        this.editor.on('input', () => this.acePlaceholder());

        setTimeout(() => this.editor.clearSelection(), 0);
        setTimeout(() => this.acePlaceholder(), 100);
        this.editorReadyResolve(this.editor);

        if (this.options.readOnly || this.component.disabled) {
          this.addClass(this.editor.container, 'ace_editor-disabled');
          this.editor.setReadOnly(true);
        }

        return this.editor;
      });
    } catch (error) {
      console.error('TextAreaComponent.addAce | cant load Ace editor', error);
      return {};
    }
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

    if (this.isAceEditor) {
      const settings = cloneDeep(this.component.wysiwyg || {});
      const props = { rows: this.component.rows };

      this.addAce(this.input, settings, props);
      return this.input;
    }

    if (this.isCkeEditor) {
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
        'The WYSIWYG settings are configured for CKEditor. For this renderer, ' +
          'you will need to use configurations for the Quill Editor. ' +
          'See https://quilljs.com/docs/configuration for more information.'
      );
      this.component.wysiwyg = this.wysiwygDefault;
      this.emit('componentEdit', this);
    }

    if (!this.component.wysiwyg || typeof this.component.wysiwyg === 'boolean') {
      this.component.wysiwyg = this.wysiwygDefault;
      this.emit('componentEdit', this);
    }

    // Add the quill editor.
    this.addQuill(this.input, this.component.wysiwyg, txt => this.updateEditorValue(txt.value))
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
    this.editorReady = new Promise(resolve => (this.editorReadyResolve = resolve));
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
      this.editorReady
        .then(editor => {
          const source = this.isCkeEditor ? 'sourceElement' : 'container';
          const parentNode = get(editor, `${source}.parentNode`);
          !parentNode && this.refreshWysiwyg();
        })
        .catch(err => console.warn(err));
    }

    return super.show(show, noClear);
  }

  redraw(...r) {
    if (this.isQuillEditor) {
      this.setWysiwygValue(this.dataValue);
      return;
    }

    super.redraw(...r);
  }
}
