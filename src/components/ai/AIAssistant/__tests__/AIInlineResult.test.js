import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import AIInlineResult from '../AIQuickActions/components/AIInlineResult';

// Lookup-backed t(): the real one falls back to the key, so an assertion on the translated wording
// fails loudly on a missing key, while an assertion on the key would pass either way.
jest.mock('@/helpers/export/util', () => {
  const ru = require('@/i18n/ru.json');
  return {
    t: key => (Object.prototype.hasOwnProperty.call(ru, key) ? ru[key] : key)
  };
});

jest.mock('@/components/common', () => ({
  Icon: ({ className }) => <i className={className} data-testid="icon" />
}));

const RETRY_SUBMIT_LABEL = 'Отправить инструкцию';

const renderResult = (props = {}) =>
  render(<AIInlineResult isVisible generatedValue="Готовый текст" onApply={jest.fn()} onCancel={jest.fn()} {...props} />);

const getRetryInput = () => screen.getByRole('textbox', { name: 'Изменить инструкцию' });

describe('AIInlineResult retry submit button', () => {
  // Test 51
  it('is addressable by role and name', () => {
    renderResult();

    const submit = screen.getByRole('button', { name: RETRY_SUBMIT_LABEL });
    expect(submit).toHaveClass('ai-inline-result__retry-submit');
  });

  it('carries a visual tooltip next to the accessible name', () => {
    renderResult();

    expect(screen.getByRole('button', { name: RETRY_SUBMIT_LABEL })).toHaveAttribute('data-tooltip', RETRY_SUBMIT_LABEL);
  });

  it('name is not the raw locale key', () => {
    renderResult();

    expect(screen.queryByRole('button', { name: 'ai-actions.result.retry-submit' })).toBeNull();
  });

  it('stays clickable through its accessible name once an instruction is typed', () => {
    const onRetry = jest.fn();
    renderResult({ onRetry });

    fireEvent.change(getRetryInput(), { target: { value: 'сделай короче' } });
    fireEvent.click(screen.getByRole('button', { name: RETRY_SUBMIT_LABEL }));

    expect(onRetry).toHaveBeenCalledWith('сделай короче');
  });

  it('is disabled while the instruction is empty', () => {
    renderResult();

    expect(screen.getByRole('button', { name: RETRY_SUBMIT_LABEL })).toBeDisabled();
  });
});

describe('AIInlineResult context label in the header', () => {
  // Test 52 — intersects with D-B-16: a text context used to be shown as the raw identifier ("general").
  it.each([
    ['general', 'Текст'],
    ['description', 'Описание'],
    ['name', 'Название']
  ])('shows the localized label of the text context %s', (contextType, label) => {
    const { container } = renderResult({ contextType });

    expect(container.querySelector('.ai-inline-result__context-type')).toHaveTextContent(label);
  });

  it('does not show the raw context identifier', () => {
    const { container } = renderResult({ contextType: 'general' });

    expect(container.querySelector('.ai-inline-result__context-type').textContent).not.toBe('general');
  });

  // Guards case A12: a script context must keep its own label.
  it('keeps the label of a script context', () => {
    const { container } = renderResult({ contextType: 'computed_attribute' });

    expect(container.querySelector('.ai-inline-result__context-type')).toHaveTextContent('Вычисляемый атрибут');
  });

  it('renders no context chip at all when the context is unknown to the caller', () => {
    const { container } = renderResult({ contextType: '' });

    expect(container.querySelector('.ai-inline-result__context-type')).toBeNull();
  });
});
