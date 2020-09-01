import Harness from '../../../test/harness';
import MLTextComponent from './MLText';

import comp1 from './fixtures/comp1';

describe('MLText Component', () => {
  it('Should build a MLText component', done => {
    Harness.testCreate(MLTextComponent, comp1).then(() => {
      done();
    });
  });
});
