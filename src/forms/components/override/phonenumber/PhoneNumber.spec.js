import Harness from '../../../test/harness';
import PhoneNumberComponent from './PhoneNumber';

import comp1 from './fixtures/comp1';

describe('PhoneNumber Component', () => {
  it('Should build a phone number component', done => {
    Harness.testCreate(PhoneNumberComponent, comp1).then(component => {
      Harness.testElements(component, 'input[type="text"]', 1);
      done();
    });
  });
});
