import { TEXT_CONTEXT_TYPES as SERVICE_TEXT_CONTEXT_TYPES } from '../TextAIService';
import { getScriptContextLabel, TEXT_CONTEXT_TYPE_LIST } from '../constants';

// The real t() returns the key itself when it is missing from the locale, so a lookup-backed mock
// makes these assertions fail loudly on a missing key instead of silently passing on the raw key.
jest.mock('@/helpers/export/util', () => {
  const ru = require('@/i18n/ru.json');
  return {
    t: key => (Object.prototype.hasOwnProperty.call(ru, key) ? ru[key] : key)
  };
});

const DEFAULT_LABEL = 'Скрипт';

describe('getScriptContextLabel', () => {
  // Test 40
  describe('script contexts', () => {
    it.each([
      ['bpmn_script_task', 'BPMN Script Task'],
      ['gateway_condition', 'Gateway Condition'],
      ['computed_attribute', 'Вычисляемый атрибут'],
      ['computed_role', 'Вычисляемая роль'],
      ['ui_action', 'UI Action скрипт'],
      ['journal_formatter', 'Форматтер журнала'],
      ['dev_console', 'Консоль разработчика']
    ])('keeps the label of %s', (contextType, label) => {
      expect(getScriptContextLabel(contextType)).toBe(label);
    });
  });

  // Test 41
  describe('text contexts', () => {
    it.each([
      ['general', 'Текст'],
      ['description', 'Описание'],
      ['name', 'Название'],
      ['comment', 'Комментарий'],
      ['documentation', 'Документация']
    ])('returns a localized label for %s', (contextType, label) => {
      expect(getScriptContextLabel(contextType)).toBe(label);
    });
  });

  // Test 42
  it('returns the default label for an unknown context type instead of the raw identifier', () => {
    expect(getScriptContextLabel('some_unknown_context')).toBe(DEFAULT_LABEL);
    expect(getScriptContextLabel('AI GENERAL')).toBe(DEFAULT_LABEL);
  });

  // Test 43
  it.each([
    ['', 'empty string'],
    [undefined, 'undefined'],
    [null, 'null']
  ])('returns the default label for %s (%s)', contextType => {
    expect(getScriptContextLabel(contextType)).toBe(DEFAULT_LABEL);
  });

  // The type map is a plain object literal, so a bracket lookup answers these from
  // `Object.prototype` with a truthy function — interpolated into the key that would then be
  // rendered as `script-context.function toString() { [native code] }`.
  it.each(['toString', 'constructor', 'valueOf', 'hasOwnProperty', '__proto__'])(
    'returns the default label for the inherited key %s',
    contextType => {
      expect(getScriptContextLabel(contextType)).toBe(DEFAULT_LABEL);
    }
  );

  // `constants.js` cannot import the list from `TextAIService.ts` — that service imports
  // `constants.js`, so the import back would close a cycle — so the list is duplicated there. This
  // is what makes the duplication safe: on drift a text context type stops being recognised as one
  // and falls through to the *script* fallback, labelling a text field's panel "Скрипт". A wrong
  // label is far harder to spot than a raw identifier, so it must not be left to a code comment.
  it('keeps the text context types in step with TextAIService', () => {
    expect([...TEXT_CONTEXT_TYPE_LIST].sort()).toEqual([...Object.values(SERVICE_TEXT_CONTEXT_TYPES)].sort());
  });

  it('never leaks a raw locale key into the interface', () => {
    const contextTypes = [
      'bpmn_script_task',
      'gateway_condition',
      'computed_attribute',
      'computed_role',
      'ui_action',
      'journal_formatter',
      'dev_console',
      'general',
      'description',
      'name',
      'comment',
      'documentation',
      'some_unknown_context',
      ''
    ];

    contextTypes.forEach(contextType => {
      const label = getScriptContextLabel(contextType);
      expect(label).not.toMatch(/^(script-context|text-context)\./);
    });
  });
});
