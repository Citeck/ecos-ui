import Harness from '../../../test/harness';
import EmailComponent from './Email';
import { basicSectionTest } from '../../../test/builder/helpers';

import comp1 from './fixtures/comp1';

basicSectionTest(EmailComponent);

describe('Email Component', () => {
  it('Should build a email component', done => {
    Harness.testCreate(EmailComponent, comp1).then(() => {
      done();
    });
  });
});
