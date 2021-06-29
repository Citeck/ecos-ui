import Harness from '../../../test/harness';
import PhoneNumberComponent from './PhoneNumber';
import { basicSectionTest } from '../../../test/builder/helpers';

import comp1 from './fixtures/comp1';

basicSectionTest(PhoneNumberComponent);

describe('PhoneNumber Component', () => {
  it('Should build a phone number component', done => {
    Harness.testCreate(PhoneNumberComponent, comp1).then(component => {
      Harness.testElements(component, 'input[type="text"]', 1);
      done();
    });
  });
});
