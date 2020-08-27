import Harness from '../../../test/harness';
import HorizontalLineComponent from './HorizontalLine';

import comp1 from './fixtures/comp1';

describe('HorizontalLine Component', () => {
  it('Should build a HorizontalLine component', done => {
    Harness.testCreate(HorizontalLineComponent, comp1).then(() => {
      done();
    });
  });
});
