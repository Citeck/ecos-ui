import { renderHook, act } from '@testing-library/react';

import useAIFieldActions from '../AIQuickActions/hooks/useAIFieldActions';

jest.mock('../AIAssistantService', () => ({
  __esModule: true,
  default: {
    isAvailable: jest.fn(() => Promise.resolve(true)),
    addAvailabilityListener: jest.fn(),
    removeAvailabilityListener: jest.fn()
  }
}));

jest.mock('../TextAIService', () => ({
  generateText: jest.fn(),
  cancelRequest: jest.fn()
}));

const mockNotificationError = jest.fn();
jest.mock('@/services/notifications', () => ({
  NotificationManager: {
    error: (...args: unknown[]) => mockNotificationError(...args)
  }
}));

// Lookup-backed t(): the real one falls back to the key, so an assertion on the translated wording
// fails loudly on a missing key.
jest.mock('@/helpers/export/util', () => {
  const ru = require('@/i18n/ru.json');
  return {
    t: (key: string) => (Object.prototype.hasOwnProperty.call(ru, key) ? ru[key] : key)
  };
});

const CURRENT_VALUE = 'var a = 1;';

const renderFieldActions = (onGenerateRequest: jest.Mock, setValue = jest.fn()) =>
  renderHook(() =>
    useAIFieldActions({
      fieldType: 'CODE',
      getValue: () => CURRENT_VALUE,
      setValue,
      recordRef: 'emodel/type@doc',
      contextType: 'computed_attribute',
      onGenerateRequest
    })
  );

const runAction = async (result: { current: { handleQuickAction: (id: string) => void } }) => {
  await act(async () => {
    result.current.handleQuickAction('explain');
  });
};

// D-G-400-SILENT (regr-20260816-r1, G15): the backend's request validator refuses oversized input
// with a localized sentence — «Текст для редактирования слишком большой… Разделите его на части» —
// and the panel closed without a word, keeping only `Request failed: 400` in the console.
describe('useAIFieldActions on a refused request', () => {
  beforeEach(() => {
    mockNotificationError.mockClear();
  });

  it('keeps the panel open and shows the reason the server gave', async () => {
    const refusal = Object.assign(new Error('Request failed: 400'), {
      status: 400,
      userMessage: 'Текст для редактирования слишком большой (262144 символов, максимум 100000).'
    });
    const { result } = renderFieldActions(jest.fn(() => Promise.reject(refusal)));

    await runAction(result);

    expect(result.current.isResultVisible).toBe(true);
    expect(result.current.result.explanation).toBe('Текст для редактирования слишком большой (262144 символов, максимум 100000).');
    // Both sides equal — the card is a message, not a proposed edit, so no diff and no «Apply»
    expect(result.current.result.generatedValue).toBe(CURRENT_VALUE);
    expect(result.current.result.originalValue).toBe(CURRENT_VALUE);
    expect(mockNotificationError).not.toHaveBeenCalled();
  });

  it('falls back to the generic notification when the refusal explains nothing', async () => {
    const refusal = Object.assign(new Error('Request failed: 500'), { status: 500 });
    const { result } = renderFieldActions(jest.fn(() => Promise.reject(refusal)));

    await runAction(result);

    expect(result.current.isResultVisible).toBe(false);
    expect(mockNotificationError).toHaveBeenCalled();
  });
});

// D-G-QA-APPLY-NOOP (regr-20260816-r1, G14): applying an answer that proposes no edit wrote the
// value back anyway, and every setValue path marks the field as changed by the user — so the form
// grew a Save bar for an edit that never happened.
describe('useAIFieldActions applying an unchanged value', () => {
  it('does not write back a value that is already in the field', async () => {
    const setValue = jest.fn();
    const { result } = renderFieldActions(
      jest.fn(() => Promise.resolve({ generatedValue: CURRENT_VALUE, explanation: 'Этот код считает сумму.' })),
      setValue
    );

    await runAction(result);
    act(() => {
      result.current.applyResult();
    });

    expect(setValue).not.toHaveBeenCalled();
    // The card is dismissed all the same — the user asked for it to go away
    expect(result.current.isResultVisible).toBe(false);
  });

  it('writes back a value that differs', async () => {
    const setValue = jest.fn();
    const { result } = renderFieldActions(
      jest.fn(() => Promise.resolve({ generatedValue: 'var a = 2;', explanation: '' })),
      setValue
    );

    await runAction(result);
    act(() => {
      result.current.applyResult();
    });

    expect(setValue).toHaveBeenCalledWith('var a = 2;');
  });
});
