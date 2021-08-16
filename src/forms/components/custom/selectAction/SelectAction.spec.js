import Harness from '../../../test/harness';
import SelectActionComponent from './SelectAction';
import { basicSectionTest } from '../../../test/builder/helpers';

import comp1 from './fixtures/comp1';

basicSectionTest(SelectActionComponent);

describe('SelectAction Component', () => {
  it('Should build a SelectAction component', done => {
    Harness.testCreate(SelectActionComponent, comp1).then(() => {
      done();
    });
  });
});
