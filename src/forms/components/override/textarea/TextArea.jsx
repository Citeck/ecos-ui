import { $generateHtmlFromNodes } from '@lexical/html';
import { fi } from 'date-fns/locale';
import Formio from 'formiojs/Formio';
import FormIOTextAreaComponent from 'formiojs/components/textarea/TextArea';
import cloneDeep from 'lodash/cloneDeep';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';
import isObject from 'lodash/isObject';
import merge from 'lodash/merge';
import NativePromise from 'native-promise-only';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';

import { overrideTriggerChange } from '../misc';

import { FIELD_TYPES } from '@/components/AIAssistant/AIQuickActions/config';
import { getContextExtractionConfig } from '@/components/AIAssistant/AIQuickActions/config/fieldActionConfigs.ts';
import editorContextService from '@/components/AIAssistant/EditorContextService';
import FormContextService from '@/components/AIAssistant/FormContextService';
import ScriptEditorAIButton from '@/components/AIAssistant/ScriptEditorAIButton';
import { TEXT_CONTEXT_TYPES } from '@/components/AIAssistant/TextAIService';
import TextAreaAIButton from '@/components/AIAssistant/TextAreaAIButton';
import LexicalEditor from '@/components/LexicalEditor';
import CodeEditor from '@/components/MonacoEditor/CodeEditor';
import { t } from '@/helpers/export/util';
import { updateEditorContent } from '@/helpers/lexical';
import { getTextByLocale } from '@/helpers/util';
import ESMRequire from '@/services/ESMRequire';
import UploadDocsRefService from '@/services/uploadDocsRefsStore';
import { getStore } from '@/store';

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

    this._lexicalRoot = null;
    this._lexicalInited = false;
    this._lexicalFirstUpdate = true;
    this._monacoFirstUpdate = true;
    this._uploadDocsRefService = new UploadDocsRefService();
    this._scriptAIButtonRoot = null;
    this._scriptAIInlineInputContainer = null;
    this._textAreaAIButtonRoot = null;
    this._textAreaAIContainer = null;
    this._monacoRoot = null;
    this.editorRef = null;
  }

  get defaultSchema() {
    return TextAreaComponent.schema();
  }

  get isLexicalEditor() {
    return this.component.editor === 'lexical';
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

  get isMonacoEditor() {
    return this.component.editor === 'monaco';
  }

  setValue(value, flags) {
    const skipSetting = isEqual(value, this.getValue());

    value = value || '';

    if (this.isLexicalEditor) {
      this.dataValue = value;
      this.setWysiwygValue(value, skipSetting, flags);
      return this.updateValue(flags);
    }

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

  setWysiwygValue(value, skipSetting, flags) {
    if (this.isLexicalEditor) {
      if (skipSetting) {
        return;
      }

      // It should be performed only when initializing data from the backend
      this.editorReady?.then(editor => {
        editor.update(() => {
          if (!this._lexicalInited) {
            updateEditorContent(editor, value);

            const editorProps = editor.getRootElement();
            const { textContent = '' } = editorProps || {};

            this._lexicalFirstUpdate = false;

            if (!!textContent) {
              this._lexicalInited = true;
            }
          }
        });
      });

      return;
    }

    if (this.isMonacoEditor) {
      if (skipSetting) {
        return;
      }

      if (this.editorRef && this.editorRef.current) {
        if (!isEmpty(value) && this._monacoFirstUpdate) {
          if (isObject(value)) {
            this.editorRef.current.setValue(JSON.stringify(value, null, 2));
          } else {
            this.editorRef.current.setValue(value || '');
          }

          this._monacoFirstUpdate = false;

          return;
        }

        this.editorRef.current.setValue(value || '');
      }
      return;
    }

    super.setWysiwygValue(value, skipSetting, flags);
  }

  createViewOnlyElement() {
    this.element = super.createViewOnlyElement();

    const theme = get(this.component, 'wysiwyg.theme');
    const className = theme ? 'ql-' + theme : '';

    if (!this.isPlain) {
      if (className) {
        this.element.classList.add('dl-html', className);
      } else {
        this.element.classList.add('dl-html');
      }
    }

    return this.element;
  }

  createViewOnlyValue(container) {
    super.createViewOnlyValue(container);

    setTimeout(() => {
      if (!this.isPlain && this.isLexicalEditor) {
        const old = this.valueElement;

        const reactContainer = document.createElement('div');
        reactContainer.id = `${this.id}-lexical-view`;
        reactContainer.className = 'lexical-readonly-container';

        old.parentNode.replaceChild(reactContainer, old);

        const store = getStore();
        this._lexicalViewRoot = createRoot(reactContainer);
        this._lexicalViewRoot.render(
          <Provider store={store}>
            <LexicalEditor
              readonly
              htmlString={this.dataValue || ''}
              placeholder="-"
              recordRef={this.root.options.recordId}
              attribute={this.component.key}
            />
          </Provider>
        );
      }
    }, 0);
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
      element.innerHTML = value;
    } else {
      element.textContent = value;
    }
  }

  loadScript(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        return resolve();
      }

      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
      document.body.appendChild(script);
    });
  }

  renderLexicalProvider(settings, onChange) {
    if (onChange) {
      const store = getStore();

      return (
        <Provider store={store}>
          <LexicalEditor
            placeholder={t('lexical.editor.placeholder.rich')}
            hideToolbar={settings.hideToolbar}
            readonly={settings.readonly}
            onChange={onChange}
            htmlString={this.dataValue || ''}
            UploadDocsService={this._uploadDocsRefService}
            recordRef={this.root.options.recordId}
            attribute={this.component.key}
            onEditorReady={editor => {
              this.calculatedValue = this.dataValue;
              this.editor = editor;
              this.editorReadyResolve(editor);
            }}
          />
        </Provider>
      );
    }

    return null;
  }

  addLexical(element, settings, onChange) {
    return new Promise(resolve => {
      if (this._lexicalRoot || this.viewOnly) {
        return;
      }

      if (this._lexicalViewRoot) {
        this._lexicalViewRoot.unmount();
      }

      const container = document.createElement('div');
      container.className = 'lexical-editor-container';
      element.appendChild(container);

      this._lexicalRoot = createRoot(container);

      this._lexicalRoot.render(this.renderLexicalProvider(settings, onChange));
      resolve(container);
    });
  }

  addCKE(element, settings, onChange) {
    settings = isEmpty(settings) ? {} : settings;
    settings.base64Upload = true;

    return new Promise((resolve, reject) => {
      ESMRequire.require(
        ['/js/lib/ckeditor5-build-classic/v12.2.0-formio.2/ckeditor.js'],
        ckeditor => {
          if (!get(element, 'parentNode')) {
            reject();
            return;
          }

          return ckeditor.create(element, settings).then(editor => {
            editor.model.document.on('change', () => {
              if (!this._ckEditorInitialized) {
                this._ckEditorInitialized = true;
                return;
              }

              onChange(editor.data.get());
            });

            // Allows you to move the button tooltips to the left to prevent unnecessary indentation
            const ckTooltips = document.querySelectorAll('.ck-tooltip');
            [...ckTooltips].map(ckTooltip => (ckTooltip.style.left = '-150%'));

            // Allows you to add an internal scroll when expanding
            const ckEditorContainer = editor.ui.view.editable.element.parentElement;
            Object.assign(ckEditorContainer.style, {
              maxWidth: '100%'
            });

            resolve(editor);
            return editor;
          });
        },
        reject
      );
    });
  }

  addQuill(element, settings, onChange) {
    const _settings = {};
    merge(_settings, this.wysiwygDefault);
    merge(_settings, settings);

    Formio.requireLibrary(
      `quill-css-${_settings.theme}`,
      'Quill',
      [{ type: 'styles', src: `https://cdn.quilljs.com/1.3.6/quill.${_settings.theme}.css` }],
      true
    );

    return new Promise((resolve, reject) => {
      ESMRequire.require(
        ['/js/lib/quill/1.3.6/quill.js'],
        Quill => {
          if (!get(element, 'parentNode')) {
            return reject(new Error('Quill: element has no parentNode'));
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

          // Allows the container to expand based on the text height value
          const qlContainers = document.querySelectorAll('.ql-container');
          [...qlContainers].map(qlContainer => (qlContainer.style.minHeight = '100%'));

          // Allows users to skip toolbar items when tabbing though form
          const buttons = document.querySelectorAll('.ql-formats > button');
          [...buttons].map(btn => btn.setAttribute('tabindex', '-1'));

          const onTextChange = () => {
            txtArea.value = get(quill, 'root.innerHTML');
            onChange(txtArea);
          };

          quill.on('text-change', onTextChange);

          resolve(quill);
          return quill;
        },
        reject
      );
    });
  }

  addAce(element, settings, props) {
    try {
      ESMRequire.require(['/js/lib/ace/1.4.1/ace.js', '/js/lib/ace/1.4.1/ext-searchbox.js'], () => {
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

        // Add AI Assistant button for script editors
        this.addScriptAIButton(element);

        return this.editor;
      });
    } catch (error) {
      console.error('TextAreaComponent.addAce | cant load Ace editor', error);
      return {};
    }
  }

  addMonaco(element, settings, props) {
    return new Promise((resolve, reject) => {
      if (this._monacoRoot || this.viewOnly) {
        resolve(this.editorRef?.current);
        return;
      }

      const store = getStore();

      try {
        const container = document.createElement('div');
        container.className = 'monaco-editor-container';
        // fontSize=13, lineHeight=1.6 from CodeEditor options
        const lineHeightPx = Math.ceil(13 * 1.6);
        const height = props.rows ? props.rows * lineHeightPx : 500;
        container.style.width = '100%';
        container.style.height = `${height}px`;
        element.appendChild(container);

        this.editorRef = React.createRef();
        this._monacoRoot = createRoot(container);

        let editorMounted = false;

        const checkEditorMount = (attempt = 0, maxAttempts = 5) => {
          if (editorMounted) return;

          const editor = this.editorRef?.current;

          if (editor && typeof editor.getValue === 'function') {
            editorMounted = true;
            this.editor = editor;
            this.editorReadyResolve(this.editor);
            if (this.options.readOnly || this.component.disabled) {
              this.editor?.updateOptions?.({ readOnly: true });
            }
            this.addScriptAIButton(element);
            resolve(this.editor);
            return;
          }

          if (attempt < maxAttempts) {
            setTimeout(() => checkEditorMount(attempt + 1, maxAttempts), 100);
          } else {
            const elapsedMs = maxAttempts * 100;
            this.showFallbackWysiwyg();
            reject(new Error('Monaco editor failed to initialize after ' + elapsedMs + 'ms'));
          }
        };

        const emptyDefault = Array(props.rows || 1)
          .fill('')
          .join('\n');

        this._monacoRoot.render(
          <Provider store={store}>
            <CodeEditor
              editorRef={this.editorRef}
              defaultValue={this.dataValue || emptyDefault}
              onCodeChange={code => this.updateEditorValue(code)}
              language={this.component.codeAs || 'javascript'}
              height={`${height}px`}
            />
          </Provider>
        );

        checkEditorMount();
      } catch (err) {
        console.error('TextAreaComponent.addMonaco | error initializing:', err);
        this.showFallbackWysiwyg();
        reject(err);
      }
    });
  }

  addScriptAIButton(editorElement) {
    // Only show AI button if aiEnabled is true and scriptContextType is configured
    if (!this.component.aiEnabled || !this.component.scriptContextType) {
      return;
    }
    const scriptContextType = this.component.scriptContextType;

    if (this.options.readOnly || this.component.disabled || this._scriptAIButtonRoot) {
      return;
    }

    try {
      // Create container for AI button
      const buttonContainer = document.createElement('div');
      buttonContainer.className = 'script-editor-ai-button-container';

      // Create container for inline input (below editor)
      const inlineInputContainer = document.createElement('div');
      inlineInputContainer.className = 'script-ai-inline-input-container';
      this._scriptAIInlineInputContainer = inlineInputContainer;

      // Position the container relative to the editor
      const editorParent = editorElement.parentElement;
      if (editorParent) {
        editorParent.style.position = 'relative';
        editorParent.appendChild(buttonContainer);
        // Append inside editor parent for overlay positioning
        editorParent.appendChild(inlineInputContainer);
      }

      const store = getStore();
      this._scriptAIButtonRoot = createRoot(buttonContainer);

      const contextData = editorContextService.getContextData() || {};
      const ecosType = contextData.ecosType || this.root?.options?.editor?.getEcosType?.() || '';
      const processRef = contextData.processRef || '';

      // Extract form context for AI (parent form data for computed attributes, etc.)
      const extractionConfig = getContextExtractionConfig(scriptContextType);
      const formContext = extractionConfig.enabled
        ? FormContextService.extractContextData(this, scriptContextType, extractionConfig)
        : null;

      const fieldContext = FormContextService.extractFieldContext(this);
      const fieldInfo =
        fieldContext ||
        (this.component
          ? {
              id: this.component.key || '',
              name: getTextByLocale(this.component.label) || this.component.key || '',
              type: this.component.dataType || 'TEXT'
            }
          : null);

      this._scriptAIButtonRoot.render(
        <Provider store={store}>
          <ScriptEditorAIButton
            disabled={this.options.readOnly || this.component.disabled}
            recordRef={this.root?.options?.recordId || ''}
            scriptContextType={scriptContextType}
            ecosType={ecosType}
            processRef={processRef}
            formContext={formContext}
            fieldInfo={fieldInfo}
            getEditorValue={() => this.editor?.getValue() || ''}
            setEditorValue={value => {
              if (this.editor) {
                if (this.isMonacoEditor) {
                  const model = this.editor.getModel();
                  if (model) {
                    model.pushEditOperations([], [{ range: model.getFullModelRange(), text: value }], () => null);
                  } else {
                    this.editor.setValue(value);
                  }
                  this.updateEditorValue(value);
                } else {
                  this.editor.setValue(value, -1);
                  this.editor.clearSelection();
                }
              }
            }}
            inlineInputContainer={inlineInputContainer}
          />
        </Provider>
      );
    } catch (error) {
      console.error('TextAreaComponent.addScriptAIButton | error:', error);
    }
  }

  /**
   * Check if AI is enabled for this textarea field
   * AI is enabled if aiEnabled is true and textAreaAIContextType is configured
   */
  get isTextAreaAIEnabled() {
    return !!this.component.aiEnabled && !!this.component.textAreaAIContextType;
  }

  /**
   * Get the AI context type for this textarea
   * Returns only explicitly configured value or default
   */
  get textAreaAIContextType() {
    return this.component.textAreaAIContextType || TEXT_CONTEXT_TYPES.GENERAL;
  }

  /**
   * Get field type for AI quick actions
   */
  get aiFieldType() {
    const contextType = this.textAreaAIContextType;

    if (contextType === TEXT_CONTEXT_TYPES.DOCUMENTATION) {
      return FIELD_TYPES.DOCUMENTATION;
    }

    return FIELD_TYPES.TEXTAREA;
  }

  /**
   * Add AI button for plain textarea fields
   */
  addTextAreaAIButton(textareaElement) {
    // Only show AI button if textAreaAIContextType is configured or auto-detected
    if (!this.isTextAreaAIEnabled) {
      return;
    }

    if (this.options.readOnly || this.component.disabled || this._textAreaAIButtonRoot) {
      return;
    }

    try {
      // Find the textarea wrapper
      const wrapper = textareaElement.parentElement;
      if (!wrapper) {
        return;
      }

      // Make wrapper position relative for absolute positioning of AI elements
      wrapper.style.position = 'relative';

      // Create container for AI button (positioned in corner of textarea)
      const buttonContainer = document.createElement('div');
      buttonContainer.className = 'textarea-ai-button-container';

      // Create container for actions bar and result (overlay below textarea)
      // Positioned inside wrapper to overlay content without affecting layout
      const aiContainer = document.createElement('div');
      aiContainer.className = 'textarea-ai-container';
      this._textAreaAIContainer = aiContainer;

      // Append both containers inside wrapper for proper positioning
      wrapper.appendChild(buttonContainer);
      wrapper.appendChild(aiContainer);

      const store = getStore();
      this._textAreaAIButtonRoot = createRoot(buttonContainer);

      // Extract field info for AI context
      const fieldInfo = this.component
        ? {
            id: this.component.key || '',
            name: getTextByLocale(this.component.label) || this.component.key || '',
            type: this.component.dataType || 'TEXT'
          }
        : null;

      this._textAreaAIButtonRoot.render(
        <Provider store={store}>
          <TextAreaAIButton
            disabled={this.options.readOnly || this.component.disabled}
            recordRef={this.root?.options?.recordId || ''}
            fieldType={this.aiFieldType}
            fieldLabel={getTextByLocale(this.component.label) || this.component.key || ''}
            contextType={this.textAreaAIContextType}
            fieldInfo={fieldInfo}
            getValue={() => this.getValue() || ''}
            setValue={value => {
              this.setValue(value);
              // Also update the textarea element directly for immediate visual feedback
              if (textareaElement) {
                textareaElement.value = value;
              }
            }}
            actionsBarContainer={aiContainer}
            resultContainer={aiContainer}
          />
        </Provider>
      );
    } catch (error) {
      console.error('TextAreaComponent.addTextAreaAIButton | error:', error);
    }
  }

  updateEditorValue(value) {
    let newValue = value;

    if (this.isLexicalEditor) {
      newValue = this.getConvertedValue(newValue);
    } else {
      newValue = this.getConvertedValue(this.removeBlanks(newValue));
    }

    if (newValue !== this.dataValue && (!isEmpty(newValue) || !isEmpty(this.dataValue))) {
      this.updateValue(
        {
          modified: !this.autoModified
        },
        newValue
      );
    }

    this.autoModified = false;
  }

  showFallbackWysiwyg() {
    // display the current value directly if editor cannot initialize
    if (this.input) {
      const val = this.dataValue || '';
      this.input.innerHTML = this.interpolate(val);
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

      // Add AI button for plain textareas (if enabled)
      if (this.isPlain && !this.options.readOnly && !this.options.htmlView) {
        // Find the textarea element
        const textareaElement = this.element?.querySelector('textarea') || this.input;
        if (textareaElement) {
          // Use setTimeout to ensure DOM is ready
          setTimeout(() => {
            this.addTextAreaAIButton(textareaElement);
          }, 0);
        }
      }

      return;
    }

    if (this.isLexicalEditor) {
      const settings = this.component.wysiwyg || {};
      this.addLexical(this.input, settings, (editorState, editor, isEmptyContent) => {
        editor.update(() => {
          const html = $generateHtmlFromNodes(editor, null);
          if (!this._lexicalFirstUpdate) {
            this.updateEditorValue(!isEmptyContent ? html : '');
          }
        });
      });
      return this.input;
    }

    if (this.isMonacoEditor) {
      const settings = cloneDeep(this.component.wysiwyg || {});
      const rows = this.component.rows || 15;
      const props = { rows };

      if (this.input) {
        const lineHeightPx = Math.ceil(13 * 1.6);
        const height = rows * lineHeightPx;
        this.input.style.minHeight = `${height}px`;
        this.input.style.height = `${height}px`;
      }

      this.addMonaco(this.input, settings, props)
        .then(editor => {
          if (this.options.readOnly || this.component.disabled) {
            editor?.updateOptions?.({ readOnly: true });
          }
          return editor;
        })
        .catch(() => {
          this.showFallbackWysiwyg();
        });
      return this.input;
    }

    if (this.isAceEditor) {
      const settings = cloneDeep(this.component.wysiwyg || {});
      const props = { rows: this.component.rows };

      const aceResult = this.addAce(this.input, settings, props);

      if (aceResult && typeof aceResult.catch === 'function') {
        aceResult.catch(() => {
          this.showFallbackWysiwyg();
        });
      }
      return this.input;
    }

    if (this.isCkeEditor) {
      const settings = this.component.wysiwyg || {};
      settings.rows = this.component.rows;
      this.addCKE(this.input, settings, newValue => this.updateEditorValue(newValue))
        .then(editor => {
          this.editor = editor;
          if (this.options.readOnly || this.component.disabled) {
            this.editor.isReadOnly = true;
          }
          this.editorReadyResolve(this.editor);
          return editor;
        })
        .catch(() => {
          // gracefully fall back to plain content when CKE fails
          this.showFallbackWysiwyg();
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
          quill.getModule('toolbar').addHandler('image', function () {
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
      .catch(err => {
        console.warn(err);
        this.showFallbackWysiwyg();
      });
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

    if (this._lexicalRoot) {
      this._lexicalRoot.unmount();
      this._lexicalRoot = null;
    }

    if (this._monacoRoot) {
      this._monacoRoot.unmount();
      this._monacoRoot = null;
    }
  }

  destroyWysiwyg() {
    if ((this.isLexicalEditor || this.isMonacoEditor) && this.editor) {
      this.editor = null;
    }

    // Unmount Lexical React root
    if (this._lexicalRoot) {
      this._lexicalRoot.unmount();
      this._lexicalRoot = null;
    }

    // Unmount Monaco React root
    if (this._monacoRoot) {
      this._monacoRoot.unmount();
      this._monacoRoot = null;
    }

    if (this._uploadDocsRefService) {
      this._uploadDocsRefService.clearUploadedEntityRefs();
    }

    super.destroyWysiwyg();
  }

  show(show, noClear) {
    // Cause: https://citeck.atlassian.net/browse/ECOSUI-89
    if (show && this.editorReady) {
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
    if (this.isQuillEditor || this.isMonacoEditor) {
      this.setWysiwygValue(this.dataValue);
      return;
    }

    super.redraw(...r);
  }

  destroy() {
    // Cleanup Lexical React root before destroying
    if (this._lexicalRoot) {
      this._lexicalRoot.unmount();
      this._lexicalRoot = null;
    }

    // Cleanup Monaco React root
    if (this._monacoRoot) {
      this._monacoRoot.unmount();
      this._monacoRoot = null;
    }

    if (this._lexicalViewRoot) {
      this._lexicalViewRoot.unmount();
      this._lexicalViewRoot = null;
    }

    // Cleanup Script AI button root
    if (this._scriptAIButtonRoot) {
      this._scriptAIButtonRoot.unmount();
      this._scriptAIButtonRoot = null;
    }

    // Remove inline input container from DOM
    if (this._scriptAIInlineInputContainer) {
      this._scriptAIInlineInputContainer.remove();
      this._scriptAIInlineInputContainer = null;
    }

    // Cleanup TextArea AI button root
    if (this._textAreaAIButtonRoot) {
      this._textAreaAIButtonRoot.unmount();
      this._textAreaAIButtonRoot = null;
    }

    // Remove TextArea AI container from DOM
    if (this._textAreaAIContainer) {
      this._textAreaAIContainer.remove();
      this._textAreaAIContainer = null;
    }

    // Prevent FormIO base destroy() from calling editor.destroy() — Lexical/Monaco use dispose(), not destroy()
    if (this.isLexicalEditor || this.isMonacoEditor) {
      this.editorReady = null;
    }

    return super.destroy();
  }
}
