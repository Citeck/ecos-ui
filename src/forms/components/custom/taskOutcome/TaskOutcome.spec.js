import Harness from '../../../test/harness';
import TaskOutcomeComponent from './TaskOutcome';

import comp1 from './fixtures/comp1';

describe('TaskOutcome Component', () => {
  it('Should build a TaskOutcome component', done => {
    Harness.testCreate(TaskOutcomeComponent, comp1).then(() => {
      done();
    });
  });
});
