import Harness from '../../../test/harness';
import ColumnsComponent from './Columns';
import { basicSectionTest } from '../../../test/builder/helpers';

import comp1 from './fixtures/comp1';

basicSectionTest(ColumnsComponent);

describe('Columns Component', () => {
  it('Should build a columns component', done => {
    Harness.testCreate(ColumnsComponent, comp1).then(component => {
      Harness.testElements(component, 'input[type="text"]', 2);
      done();
    });
  });
});
