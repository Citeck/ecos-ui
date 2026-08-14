import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import AIActionsBar from '../AIQuickActions/components/AIActionsBar';

// The real t() returns the key itself when it is missing from the locale, and `title` alone already
// gives a button some accessible name. Asserting "the name exists" would therefore pass on the raw
// key `ai-actions.input.close` — the very defect D-B-16. Hence the lookup-backed mock and the
// assertions on the translated wording.
jest.mock('@/helpers/export/util', () => {
  const ru = require('@/i18n/ru.json');
  return {
    t: key => (Object.prototype.hasOwnProperty.call(ru, key) ? ru[key] : key)
  };
});

jest.mock('@/components/common', () => ({
  Icon: ({ className }) => <i className={className} data-testid="icon" />
}));

const CLOSE_LABEL = 'Закрыть (Escape)';
const SUBMIT_LABEL = 'Отправить (Enter)';
const PLACEHOLDER = 'Опишите, что нужно сделать...';

const renderBar = (props = {}) => render(<AIActionsBar isVisible {...props} />);

const typePrompt = (value = 'сделай короче') => fireEvent.change(screen.getByRole('textbox'), { target: { value } });

describe('AIActionsBar accessible names', () => {
  // Test 48
  it('close button carries the translated tooltip and accessible name', () => {
    renderBar();

    const close = screen.getByRole('button', { name: CLOSE_LABEL });
    expect(close).toHaveClass('ai-actions-bar__close');
    expect(close).toHaveAttribute('title', CLOSE_LABEL);
    // `title` is only the last resort of the accessible-name computation: it loses to any label on
    // the element and is not announced consistently. The explicit label is asserted separately.
    expect(close).toHaveAttribute('aria-label', CLOSE_LABEL);
  });

  it('close button name is not the raw locale key', () => {
    renderBar();

    expect(screen.queryByRole('button', { name: 'ai-actions.input.close' })).toBeNull();
  });

  // Test 49
  it('submit button carries the translated tooltip and accessible name', () => {
    renderBar();
    // The submit button only appears once there is something to submit.
    typePrompt();

    const submit = screen.getByRole('button', { name: SUBMIT_LABEL });
    expect(submit).toHaveClass('ai-actions-bar__submit');
    expect(submit).toHaveAttribute('title', SUBMIT_LABEL);
    expect(submit).toHaveAttribute('aria-label', SUBMIT_LABEL);
  });

  it('submit button name is not the raw locale key', () => {
    renderBar();
    typePrompt();

    expect(screen.queryByRole('button', { name: 'ai-actions.input.submit' })).toBeNull();
  });

  it('submit button stays clickable through its accessible name', () => {
    const onSubmit = jest.fn();
    renderBar({ onSubmit });
    typePrompt('сделай короче');

    fireEvent.click(screen.getByRole('button', { name: SUBMIT_LABEL }));

    expect(onSubmit).toHaveBeenCalledWith('сделай короче');
  });

  it('close button stays clickable through its accessible name', () => {
    const onClose = jest.fn();
    renderBar({ onClose });

    fireEvent.click(screen.getByRole('button', { name: CLOSE_LABEL }));

    expect(onClose).toHaveBeenCalled();
  });
});

describe('AIActionsBar placeholder', () => {
  // Test 50
  it('falls back to the translated default placeholder', () => {
    renderBar();

    expect(screen.getByRole('textbox')).toHaveAttribute('placeholder', PLACEHOLDER);
  });

  it('does not show the raw locale key as the placeholder', () => {
    renderBar();

    expect(screen.getByRole('textbox').getAttribute('placeholder')).not.toBe('ai-actions.input.placeholder');
  });

  it('an explicit placeholder prop still wins over the default one', () => {
    renderBar({ placeholder: 'Опишите, что сделать с текстом...' });

    expect(screen.getByRole('textbox')).toHaveAttribute('placeholder', 'Опишите, что сделать с текстом...');
  });
});
