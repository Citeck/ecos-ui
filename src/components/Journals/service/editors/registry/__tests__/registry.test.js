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
    test(`${type} waits ${editorClass.name}`, () => {
      const editorInstance = editorRegistry.getEditor(type);
      expect(editorInstance instanceof editorClass).toBeTruthy();
    });
  });

  describe.each([
    ['boolean', 'Select'],
    ['boolean', 'Select', { mode: 'select' }],
    ['boolean', 'Checkbox', { mode: 'checkbox' }],
    ['date', 'DatePicker', {}, true],
    ['datetime', 'DatePicker', {}, true],
    ['journal', 'SelectJournal'],
    ['orgstruct', 'SelectOrgstruct', {}, true],
    ['select', 'Select'],
    ['number', 'Input'],
    ['text', 'Input'],
    [undefined, 'Input'],
    ['unknown', 'Input']
  ])('type > editor control > expected element', (type, controlClassName, config = {}, wrapper) => {
    test(`${type} waits ${controlClassName}`, () => {
      const editorInstance = editorRegistry.getEditor(type);
      const Control = editorInstance.getControl(config, {});
      const shallow1 = shallow(<Control />);
      let ReactComp;

      if (wrapper) {
        ReactComp = shallow1
          .first()
          .dive()
          .getElement();
      } else {
        ReactComp = shallow1.getElement();
      }
      console.log(ReactComp);
      expect(ReactComp.type.name).toEqual(controlClassName);
    });
  });
});
