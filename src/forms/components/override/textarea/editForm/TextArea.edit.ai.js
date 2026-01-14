import { t } from '@/helpers/export/util';

/**
 * AI settings tab configuration for TextArea component
 *
 * NOTE: Components are on top level (not nested in panels) due to FormIO bug
 * where select inside conditionally hidden panel doesn't initialize data.values
 * See: https://github.com/formio/formio.js/issues/553
 */
export default [
  {
    type: 'checkbox',
    key: 'aiEnabled',
    get label() {
      return `${t('form-constructor.textarea.ai.enabled')} <span class="badge badge-secondary" style="font-weight: normal; font-size: 10px; vertical-align: middle;">Enterprise</span>`;
    },
    get tooltip() {
      return t('form-constructor.textarea.ai.enabled-tooltip');
    },
    weight: 10,
    input: true,
    defaultValue: false
  },
  // ACE Editor select
  {
    type: 'select',
    key: 'scriptContextType',
    weight: 20,
    get label() {
      return t('form-constructor.textarea.script-context-type.label');
    },
    get tooltip() {
      return t('form-constructor.textarea.script-context-type.tooltip');
    },
    input: true,
    dataSrc: 'values',
    template: '<span>{{ item.label }}</span>',
    conditional: {
      json: {
        and: [
          { '===': [{ var: 'data.aiEnabled' }, true] },
          { '===': [{ var: 'data.editor' }, 'ace'] }
        ]
      }
    },
    data: {
      get values() {
        return [
          { value: 'bpmn_script_task', label: t('form-constructor.textarea.script-context.bpmn-script-task') },
          { value: 'gateway_condition', label: t('form-constructor.textarea.script-context.gateway-condition') },
          { value: 'computed_attribute', label: t('form-constructor.textarea.script-context.computed-attribute') },
          { value: 'computed_role', label: t('form-constructor.textarea.script-context.computed-role') },
          { value: 'ui_action', label: t('form-constructor.textarea.script-context.ui-action') },
          { value: 'journal_formatter', label: t('form-constructor.textarea.script-context.journal-formatter') }
        ];
      }
    }
  },
  // Plain textarea select
  {
    type: 'select',
    key: 'textAreaAIContextType',
    weight: 30,
    get label() {
      return t('form-constructor.textarea.ai.context-type.label');
    },
    get tooltip() {
      return t('form-constructor.textarea.ai.context-type.tooltip');
    },
    input: true,
    dataSrc: 'values',
    template: '<span>{{ item.label }}</span>',
    conditional: {
      json: {
        and: [
          { '===': [{ var: 'data.aiEnabled' }, true] },
          { '!==': [{ var: 'data.editor' }, 'ace'] },
          { '!==': [{ var: 'data.editor' }, 'ckeditor'] },
          { '!==': [{ var: 'data.editor' }, 'quill'] },
          { '!==': [{ var: 'data.editor' }, 'lexical'] }
        ]
      }
    },
    data: {
      get values() {
        return [
          { value: 'general', label: t('form-constructor.textarea.ai.context-type.general') },
          { value: 'documentation', label: t('form-constructor.textarea.ai.context-type.documentation') },
          { value: 'description', label: t('form-constructor.textarea.ai.context-type.description') },
          { value: 'comment', label: t('form-constructor.textarea.ai.context-type.comment') }
        ];
      }
    }
  }
];
