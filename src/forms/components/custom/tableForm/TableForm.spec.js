import Harness from '../../../test/harness';
import TableFormComponent from './TableForm';
import { basicSectionTest } from '../../../test/builder/helpers';

import comp1 from './fixtures/comp1';

basicSectionTest(TableFormComponent);

describe('TableForm Component', () => {
  it('Should build a TableForm component', done => {
    Harness.testCreate(TableFormComponent, comp1).then(() => {
      done();
    });
  });
});
