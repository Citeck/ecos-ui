import Harness from '../../../test/harness';
import IncludeFormComponent from './IncludeForm';

import comp1 from './fixtures/comp1';

describe('IncludeForm Component', () => {
  it('Should build a IncludeForm component in Form Builder', done => {
    Harness.testCreate(IncludeFormComponent, comp1, { builder: true }).then(() => done());
  });

  it('Should build a IncludeForm component in Form View', done => {
    Harness.testCreate(IncludeFormComponent, comp1, {}).then(() => done());
  });
});
