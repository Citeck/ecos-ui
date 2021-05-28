import Harness from '../../../test/harness';
import MLTextComponent from './MLText';
import { basicSectionTest } from '../../../test/builder/helpers';

import comp1 from './fixtures/comp1';

basicSectionTest(MLTextComponent);

describe('MLText Component', () => {
  it('Should build a MLText component', done => {
    Harness.testCreate(MLTextComponent, comp1).then(() => {
      done();
    });
  });
});
