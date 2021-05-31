import Harness from '../../../test/harness';
import DataGridAssocComponent from './DataGridAssoc';
import { basicSectionTest } from '../../../test/builder/helpers';

import comp1 from './fixtures/comp1';

basicSectionTest(DataGridAssocComponent);

describe('DataGridAssoc Component', () => {
  it('Should build a DataGridAssoc component', done => {
    Harness.testCreate(DataGridAssocComponent, comp1).then(() => {
      done();
    });
  });
});
