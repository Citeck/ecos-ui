import Harness from '../../../test/harness';
import AsyncDataComponent from './AsyncData';

import comp1 from './fixtures/comp1';

describe('AsyncData Component', () => {
  it('Should build an AsyncData component', done => {
    Harness.testCreate(AsyncDataComponent, comp1).then(() => {
      done();
    });
  });
});
