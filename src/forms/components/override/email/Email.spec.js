import Harness from '../../../test/harness';
import EmailComponent from './Email';

import comp1 from './fixtures/comp1';

describe('Email Component', () => {
  it('Should build a email component', done => {
    Harness.testCreate(EmailComponent, comp1).then(() => {
      done();
    });
  });
});
