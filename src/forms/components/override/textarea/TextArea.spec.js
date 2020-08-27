import Harness from '../../../test/harness';
import TextAreaComponent from './TextArea';

import comp1 from './fixtures/comp1';

describe('TextArea Component', () => {
  it('Should build a TextArea component', done => {
    Harness.testCreate(TextAreaComponent, comp1).then(component => {
      Harness.testElements(component, 'textarea', 1);
      done();
    });
  });
});
