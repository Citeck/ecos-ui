import { render } from '@testing-library/react';
import React from 'react';

import TextAreaAIButton from '../TextAreaAIButton';
import { generateText } from '../TextAIService';

// Capture the onGenerateRequest callback passed to AIFieldActions so we can invoke it directly.
let capturedOnGenerate = null;
let capturedProps = null;
jest.mock('../AIQuickActions/components', () => ({
  AIFieldActions: props => {
    capturedOnGenerate = props.onGenerateRequest;
    capturedProps = props;
    return null;
  }
}));

jest.mock('../TextAIService', () => ({
  __esModule: true,
  generateText: jest.fn(() => Promise.resolve({ generatedText: 'fixed', explanation: '' })),
  TEXT_QUICK_ACTIONS: {
    IMPROVE: 'improve',
    EXPAND: 'expand',
    SUMMARIZE: 'summarize',
    FIX_GRAMMAR: 'fix-grammar',
    TRANSLATE: 'translate',
    SIMPLIFY: 'simplify',
    FORMALIZE: 'formalize'
  },
  TEXT_CONTEXT_TYPES: { GENERAL: 'general', DESCRIPTION: 'description' }
}));

describe('TextAreaAIButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedOnGenerate = null;
    capturedProps = null;
  });

  // D-B-1: the popups are anchored to the small trigger button, so without the field element they
  // are bounded by the window alone and cover the text being edited. `TextArea.jsx` passes the
  // textarea DOM node down; this is the plain-textarea half of the wiring (the rich-text half goes
  // through the Lexical toolbar button).
  it('passes the field element down so the popups can be bounded by it', () => {
    const textarea = document.createElement('textarea');

    render(<TextAreaAIButton contextType="description" getValue={() => ''} setValue={() => {}} fieldElement={textarea} />);

    expect(capturedProps.fieldElement).toBe(textarea);
  });

  it('stays usable when no field element is available', () => {
    render(<TextAreaAIButton contextType="description" getValue={() => ''} setValue={() => {}} />);

    expect(capturedProps).not.toBeNull();
    expect(capturedProps.fieldElement).toBeUndefined();
  });

  // COREDEV-323: regression — the field's semantic contextType ('description') must NOT be
  // sent as the content format. It used to leak into contentType and broke backend parsing.
  it('sends content FORMAT (default text) in contentType, not the semantic contextType', async () => {
    render(<TextAreaAIButton contextType="description" getValue={() => ''} setValue={() => {}} />);

    expect(typeof capturedOnGenerate).toBe('function');
    await capturedOnGenerate({ quickActionId: 'fix-grammar', currentValue: 'текст' });

    expect(generateText).toHaveBeenCalledTimes(1);
    const arg = generateText.mock.calls[0][0];
    expect(arg.contentType).toBe('text'); // CONTENT_TYPES.TEXT
    expect(arg.contentType).not.toBe('description');
    expect(arg.quickAction).toBe('fix-grammar');
  });

  it('honors an explicit content format (e.g. html for rich-text fields)', async () => {
    render(<TextAreaAIButton contextType="description" contentType="html" getValue={() => ''} setValue={() => {}} />);

    await capturedOnGenerate({ quickActionId: 'improve', currentValue: 'x' });

    expect(generateText.mock.calls[0][0].contentType).toBe('html');
  });
});
