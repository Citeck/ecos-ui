import cloneDeep from 'lodash/cloneDeep';

import Harness from '../../../test/harness';
import TextAreaComponent from './TextArea';
import { basicSectionTest } from '../../../test/builder/helpers';
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
});
