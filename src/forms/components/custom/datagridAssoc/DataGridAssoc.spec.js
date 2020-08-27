import Harness from '../../../test/harness';
import DataGridAssocComponent from './DataGridAssoc';

import comp1 from './fixtures/comp1';

describe('DataGridAssoc Component', () => {
  it('Should build a DataGridAssoc component', done => {
    Harness.testCreate(DataGridAssocComponent, comp1).then(() => {
      done();
    });
  });
});
