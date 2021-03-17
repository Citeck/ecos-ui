import React from 'react';
import { shallow } from 'enzyme';

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
  const shallow1 = shallow(<Control config={config} value={value} />);
  let ReactComp;

  if (wrapper) {
    ReactComp = shallow1
      .first()
      .dive()
      .getElement();
  } else {
    ReactComp = shallow1.getElement();
  }

  return ReactComp;
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
    ['unknown', TextEditor]
  ])('type > editor class', (type, editorClass) => {
    test(`${type} expects ${editorClass.name}`, () => {
      const editorInstance = editorRegistry.getEditor(type);
      expect(editorInstance instanceof editorClass).toBeTruthy();
    });
  });

  describe.each([
    ['boolean', 'Select'],
    ['boolean', 'Select', { mode: 'select' }],
    ['boolean', 'Checkbox', { mode: 'checkbox' }],
    ['date', 'DatePicker', {}, WRAPPER],
    ['datetime', 'DatePicker', {}, WRAPPER],
    ['journal', 'SelectJournal'],
    ['orgstruct', 'SelectOrgstruct', {}, WRAPPER],
    ['select', 'Select'],
    ['number', 'Input'],
    ['text', 'Input'],
    [undefined, 'Input'],
    ['unknown', 'Input']
  ])('type > expected element', (type, controlClassName, config = {}, wrapper) => {
    const ReactComp = getEditorComponent({ type, config, wrapper });

    test(`${type} expects ${controlClassName}`, () => {
      expect(ReactComp.type.name).toEqual(controlClassName);
    });
  });

  describe.each([
    ['boolean', { config: { mode: 'checkbox' }, value: true, checked: true }],
    ['boolean', { config: { mode: 'checkbox' }, value: false, checked: false }],
    ['date', { showTimeSelect: undefined, dateFormat: 'DD.MM.YYYY' }, WRAPPER],
    ['datetime', { showTimeSelect: true, dateFormat: 'DD.MM.YYYY HH:mm' }, WRAPPER],
    ['journal', { config: { journalId: '1' }, journalId: '1' }],
    ['orgstruct', { config: { allowedAuthorityTypes: 'USER' }, allowedAuthorityTypes: ['USER'] }, WRAPPER],
    ['number', { type: 'number' }],
    ['text', { type: 'text' }]
  ])('type > expected props', (type, params = {}, wrapper) => {
    const { config = {}, value, ...props } = params;
    const ReactComp = getEditorComponent({ type, config, value, wrapper });

    for (let prop in props) {
      test(`${type} expects ${prop} = ${props[prop]}`, () => {
        expect(ReactComp.props[prop]).toEqual(props[prop]);
      });
    }
  });
});
