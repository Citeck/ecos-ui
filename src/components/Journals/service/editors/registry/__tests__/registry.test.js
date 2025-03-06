/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';

import editorRegistry from '../';
import BooleanEditor from '../BooleanEditor';
import DateEditor from '../DateEditor';
import DateTimeEditor from '../DateTimeEditor';
import JournalEditor from '../JournalEditor';
import NumberEditor from '../NumberEditor';
import OrgstructEditor from '../OrgstructEditor';
import SelectEditor from '../SelectEditor';
import TextEditor from '../TextEditor';
import { DatePicker } from '../../../../../common/form';

const WRAPPER = true;

function getEditorComponent({ type, config, value, wrapper }) {
  const editorInstance = editorRegistry.getEditor(type);
  const Control = editorInstance.getControl(config, {});

  return render(<Control config={config} value={value} />);
}

describe('editors registry', () => {
  describe.each([
    ['boolean', BooleanEditor],
    ['date', DateEditor],
    ['datetime', DateTimeEditor],
    ['journal', JournalEditor],
    ['number', NumberEditor],
    ['orgstruct', OrgstructEditor],
    ['select', SelectEditor],
    ['text', TextEditor],
    [undefined, TextEditor],
    ['unknown', TextEditor],
  ])('type > editor class', (type, editorClass) => {
    test(`type "${type}" expects editor "${editorClass.name}"`, () => {
      const editorInstance = editorRegistry.getEditor(type);
      expect(editorInstance instanceof editorClass).toBeTruthy();
    });
  });

  describe.each([
    ['boolean', 'ecos-select'],
    ['boolean', 'ecos-select', { mode: 'select' }],
    ['boolean', 'ecos-checkbox', { mode: 'checkbox' }],
    ['date', 'ecos-datepicker', {}, WRAPPER],
    ['datetime', 'ecos-datepicker', {}, WRAPPER],
    ['journal', 'select-journal'],
    ['orgstruct', 'select-orgstruct', {}, WRAPPER],
    // ['select', 'div', {options: []}], // TODO: isLoading state incorrect
    ['number', 'ecos-input'],
    ['text', 'ecos-input'],
    [undefined, 'ecos-input'],
    ['unknown', 'ecos-input'],
  ])('type > expected element', (type, controlClassName, config = {}, wrapper) => {
    const editorInstance = editorRegistry.getEditor(type);
    const Control = editorInstance.getControl(config, {});

    test(`type "${type}" has element by class=${controlClassName}`, () => {
      const { container } = render(<Control config={config} value={undefined} />);

      expect(container.getElementsByClassName(controlClassName)).toHaveLength(1);
    });
  });

  describe.each([
    ['boolean', { config: { mode: 'checkbox' }, value: true, checked: true }],
    ['boolean', { config: { mode: 'checkbox' }, value: false, checked: false }],
    ['date', { showTimeInput: undefined, dateFormat: 'dd.MM.yyyy' }, WRAPPER],
    ['datetime', { showTimeInput: true, dateFormat: 'dd.MM.yyyy HH:mm' }, WRAPPER],
    ['journal', { config: { journalId: '1' }, journalId: '1' }],
    ['orgstruct', { config: { allowedAuthorityTypes: 'USER' }, allowedAuthorityTypes: ['USER'] }, WRAPPER],
    ['number', { type: 'number' }],
    ['text', { type: 'text' }],
  ])('type > expected props', (type, params = {}, wrapper) => {
    const { config = {}, value, ...props } = params;
    const editorInstance = editorRegistry.getEditor(type);
    const Control = editorInstance.getControl(config, {});

    const { asFragment } = getEditorComponent({ type, config, value, wrapper });

    test(`type "${type}" expects props`, () => {
      expect(asFragment(<Control {...props} />)).toMatchSnapshot();
    });
  });
});
