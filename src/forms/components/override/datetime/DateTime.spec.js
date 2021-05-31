import Harness from '../../../test/harness';
import DateTimeComponent from './DateTime';
import { basicSectionTest } from '../../../test/builder/helpers';

import comp1 from './fixtures/comp1';

basicSectionTest(DateTimeComponent);

describe('DateTime Component', () => {
  it('Should build a date time component', done => {
    Harness.testCreate(DateTimeComponent, comp1).then(() => {
      done();
    });
  });
});
