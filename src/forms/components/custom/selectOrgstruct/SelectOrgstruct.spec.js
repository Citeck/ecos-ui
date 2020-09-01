import Harness from '../../../test/harness';
import SelectOrgstructComponent from './SelectOrgstruct';

import comp1 from './fixtures/comp1';

describe('SelectOrgstruct Component', () => {
  it('Should build a SelectOrgstruct component', done => {
    Harness.testCreate(SelectOrgstructComponent, comp1).then(() => {
      done();
    });
  });
});
