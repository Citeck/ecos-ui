import cloneDeep from 'lodash/cloneDeep';

import { basicSectionTest } from '../../../test/builder/helpers';
import Harness from '../../../test/harness';

import TextAreaComponent from './TextArea';
import comp1 from './fixtures/comp1';

basicSectionTest(TextAreaComponent);

describe('TextArea Component', () => {
  it('Should build a TextArea component', done => {
    Harness.testCreate(TextAreaComponent, comp1).then(component => {
      Harness.testElements(component, 'textarea', 1);
      done();
    });
  });

  it('Should be unreadable value', done => {
    const comp = Object.assign(cloneDeep(comp1), { unreadable: true });

    Harness.testCreate(TextAreaComponent, comp, { readOnly: false }).then(component => Harness.testUnreadableField(component, done));
  });

  it('Should recognize monaco as wysiwyg editor', () => {
    const comp = Object.assign(cloneDeep(comp1), {
      editor: 'monaco',
      wysiwyg: true
    });

    return Harness.testCreate(TextAreaComponent, comp).then(component => {
      expect(component.isMonacoEditor).toBe(true);
    });
  });

  it('Should provide fallback display helper', () => {
    const comp = Object.assign(cloneDeep(comp1), {
      editor: 'monaco',
      wysiwyg: true
    });
    return Harness.testCreate(TextAreaComponent, comp).then(component => {
      component.input = document.createElement('div');
      component.dataValue = 'fallback text';
      component.showFallbackWysiwyg();
      expect(component.input.innerHTML).toContain('fallback text');
    });
  });
});
