import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import Settings from '../Settings';

import { defaultPrintSettings } from '@/dto/barcodePrint';
import { t } from '@/helpers/util';

jest.mock('@/components/journals/Filters/Filters', () => () => <div data-testid="conditions" />);
jest.mock('@/components/common', () => ({ InfoText: ({ text }) => <p>{text}</p> }));
jest.mock('@/components/common/form', () => ({
  Input: require('@/components/common/form/Input/Input').default,
  Label: require('@/components/common/form/Label/Label').default,
  Caption: ({ children }) => <h2>{children}</h2>,
  Select: () => <select aria-label="legacy type" />
}));

const field = key => screen.getByLabelText(t(`barcode-widget.print.field.${key}`));
const done = () => screen.getByRole('button', { name: t('btn.done.label') });

describe('modern Barcode Settings', () => {
  it('shows only effective A4 controls, keeps conditions, saves a separate numeric schema', () => {
    const onSave = jest.fn();
    render(
      <Settings
        isLegacy={false}
        settings={{ scale: 500, right: 200 }}
        onSave={onSave}
        modelAttributes={[{ id: 'name', name: 'Name', type: 'text' }]}
      />
    );
    expect(field('scalePercent')).toHaveValue('100');
    expect(field('offsetLeftMm')).toHaveValue('20');
    expect(screen.getAllByRole('textbox')).toHaveLength(3);
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.getByText(t('barcode-widget.print.page-a4'))).toBeInTheDocument();
    expect(screen.getByTestId('conditions')).toBeInTheDocument();
    fireEvent.change(field('scalePercent'), { target: { value: '1,5' } });
    fireEvent.change(field('offsetLeftMm'), { target: { value: '0' } });
    fireEvent.change(field('offsetTopMm'), { target: { value: '1.5' } });
    fireEvent.click(done());
    expect(onSave).toHaveBeenCalledWith(
      { ...defaultPrintSettings, scalePercent: 1.5, offsetLeftMm: 0, offsetTopMm: 1.5 },
      expect.objectContaining({ btnGenerateNew: expect.anything() })
    );
  });

  it.each(['', '-5', '0', 'NaN', 'Infinity'])('keeps invalid scale input %s visible, labels its error and prevents saving', value => {
    const onSave = jest.fn();
    render(<Settings isLegacy={false} onSave={onSave} />);
    fireEvent.change(field('scalePercent'), { target: { value } });
    expect(field('scalePercent')).toHaveValue(value);
    expect(field('scalePercent')).toHaveAttribute('aria-invalid', 'true');
    expect(field('scalePercent')).toHaveAccessibleDescription(t('barcode-widget.print.validation.scalePercent'));
    expect(done()).toBeDisabled();
    fireEvent.click(done());
    expect(onSave).not.toHaveBeenCalled();
    fireEvent.change(field('scalePercent'), { target: { value: '100' } });
    expect(done()).toBeEnabled();
  });

  it.each([
    ['offsetLeftMm', '210'],
    ['offsetTopMm', '297'],
    ['offsetLeftMm', '-1'],
    ['offsetTopMm', '']
  ])('validates offset %s=%s beside the field', (key, value) => {
    render(<Settings isLegacy={false} />);
    fireEvent.change(field(key), { target: { value } });
    expect(field(key)).toHaveAccessibleDescription(t(`barcode-widget.print.validation.${key}`));
    expect(done()).toBeDisabled();
  });

  it('warns about an unknown schema and permits an explicit corrective save', () => {
    const onSave = jest.fn();
    render(<Settings isLegacy={false} printSettings={{ version: 2, pageFormat: 'Letter', offsetLeftMm: 0 }} onSave={onSave} />);
    expect(screen.getByRole('alert')).toHaveTextContent(t('barcode-widget.print.schema-repair'));
    fireEvent.click(done());
    expect(onSave.mock.calls[0][0]).toEqual({ ...defaultPrintSettings, offsetLeftMm: 0 });
  });

  it('uses unique label associations when two widgets have settings open', () => {
    const { container } = render(
      <>
        <Settings isLegacy={false} />
        <Settings isLegacy={false} />
      </>
    );
    const ids = [...container.querySelectorAll('input')].map(input => input.id);
    expect(new Set(ids).size).toBe(6);
  });

  it('leaves the legacy controls and save contract unchanged', () => {
    const onSave = jest.fn();
    const settings = { type: 'code-128', scale: 500, left: 20, right: 200, top: 20, bottom: 50 };
    render(<Settings settings={settings} allowedTypes={[{ value: 'code-128', label: 'Code-128' }]} onSave={onSave} />);
    expect(screen.getAllByRole('textbox')).toHaveLength(5);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    fireEvent.click(done());
    expect(onSave.mock.calls[0][0]).toEqual(settings);
  });
});
