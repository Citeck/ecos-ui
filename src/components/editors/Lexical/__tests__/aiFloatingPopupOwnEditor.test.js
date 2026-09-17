import { render } from '@testing-library/react';
import React from 'react';

import AIFloatingPopup, { AI_FLOATING_POPUP_OPEN } from '../plugins/FloatingTextFormatToolbarPlugin/AIFloatingPopup';

/**
 * Found during the COREDEV-534 acceptance pass: on a record card the properties form mounts two
 * Lexical editors (one visible, one hidden), and `AIFloatingPopup` is mounted once per editor while
 * `AI_FLOATING_POPUP_OPEN` is a plain window event. Both popups therefore opened on the same click
 * and drew two identical panels at the very same coordinates, one covering the other.
 *
 * The event carries the editor whose toolbar button raised it, so each popup only has to recognise
 * its own. These tests pin that: one editor answers, the others stay shut.
 *
 * The composer context and the AI hook are mocked so each mounted popup gets its own editor and its
 * own `openActionsBar`; both are memoised per instance, so a re-render keeps the same pair.
 */

/** Editors and hook results handed out in mount order; `mock` prefix is what jest.mock hoisting allows. */
const mockEditors = [];
const mockHookResults = [];
let mockNextEditor = 0;
let mockNextHook = 0;

jest.mock('@lexical/react/LexicalComposerContext', () => ({
  useLexicalComposerContext: () => {
    const [editor] = require('react').useState(() => mockEditors[mockNextEditor++]);

    return [editor];
  }
}));

jest.mock('@/components/ai/AIAssistant/AIQuickActions/hooks/useAIFieldActions', () => ({
  __esModule: true,
  default: () => {
    const [result] = require('react').useState(() => mockHookResults[mockNextHook++]);

    return result;
  }
}));

jest.mock('@/components/editors/Lexical/hooks/useLexicalAIGenerate', () => ({
  useLexicalAIGenerateWithRefs: () => ({ contextRef: { current: {} }, handleGenerateRequest: jest.fn() })
}));

jest.mock('@/components/ai/AIAssistant/AIQuickActions/components/AIPopperWrapper', () => () => null);
jest.mock('@/components/ai/AIAssistant/AIQuickActions/components/AIActionsBar', () => () => null);
jest.mock('@/components/ai/AIAssistant/AIQuickActions/components/AIInlineResult', () => () => null);

/** A stand-in Lexical editor: the popup only uses its identity and `getRootElement`. */
const makeEditor = name => ({ name, getRootElement: () => document.createElement('div') });

const emptyHookResult = () => ({
  isActionsBarVisible: false,
  isResultVisible: false,
  isGenerating: false,
  isApplying: false,
  result: { originalValue: '', generatedValue: '', explanation: '' },
  fieldConfig: { getPlaceholder: () => '' },
  availableActions: [],
  openActionsBar: jest.fn(),
  closeActionsBar: jest.fn(),
  closeResult: jest.fn(),
  handleQuickAction: jest.fn(),
  handlePromptSubmit: jest.fn(),
  applyResult: jest.fn(),
  retryGeneration: jest.fn(),
  requestAnotherVariant: jest.fn()
});

/** Mount one popup bound to `editor`; returns the hook result that popup reads. */
const mountPopup = editor => {
  mockEditors.push(editor);
  const hookResult = emptyHookResult();

  mockHookResults.push(hookResult);
  render(<AIFloatingPopup />);

  return hookResult;
};

const fireOpen = editor =>
  window.dispatchEvent(
    new CustomEvent(AI_FLOATING_POPUP_OPEN, {
      detail: {
        editor,
        triggerRect: { top: 10, left: 20, width: 30, height: 40 },
        selectedText: '',
        currentValue: '',
        recordRef: 'emodel/deal@x',
        attribute: 'description',
        attributeLabel: 'Описание'
      }
    })
  );

describe('AIFloatingPopup opens only for its own editor (COREDEV-534 acceptance finding)', () => {
  beforeEach(() => {
    mockEditors.length = 0;
    mockHookResults.length = 0;
    mockNextEditor = 0;
    mockNextHook = 0;
  });

  it('opens the popup of the editor that raised the event', () => {
    const editor = makeEditor('only');
    const popup = mountPopup(editor);

    fireOpen(editor);

    expect(popup.openActionsBar).toHaveBeenCalledTimes(1);
  });

  it('leaves the other editor on the page shut', () => {
    const visible = makeEditor('visible');
    const hidden = makeEditor('hidden');
    const visiblePopup = mountPopup(visible);
    const hiddenPopup = mountPopup(hidden);

    fireOpen(visible);

    expect(visiblePopup.openActionsBar).toHaveBeenCalledTimes(1);
    expect(hiddenPopup.openActionsBar).not.toHaveBeenCalled();
  });

  it('answers each editor in turn, never both at once', () => {
    const first = makeEditor('first');
    const second = makeEditor('second');
    const firstPopup = mountPopup(first);
    const secondPopup = mountPopup(second);

    fireOpen(second);
    fireOpen(first);

    expect(firstPopup.openActionsBar).toHaveBeenCalledTimes(1);
    expect(secondPopup.openActionsBar).toHaveBeenCalledTimes(1);
  });

  it('ignores an event from an editor that has no popup mounted', () => {
    const mounted = makeEditor('mounted');
    const popup = mountPopup(mounted);

    fireOpen(makeEditor('elsewhere'));

    expect(popup.openActionsBar).not.toHaveBeenCalled();
  });
});
