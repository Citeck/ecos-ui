import Harness from '../../../test/harness';
import SelectActionComponent from './SelectAction';

import comp1 from './fixtures/comp1';

describe('SelectAction Component', () => {
  it('Should build a SelectAction component', done => {
    Harness.testCreate(SelectActionComponent, comp1).then(() => {
      done();
    });
  });
});
