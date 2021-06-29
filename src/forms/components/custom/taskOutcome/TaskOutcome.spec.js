import Harness from '../../../test/harness';
import TaskOutcomeComponent from './TaskOutcome';
import { basicSectionTest } from '../../../test/builder/helpers';

import comp1 from './fixtures/comp1';

basicSectionTest(TaskOutcomeComponent);

describe('TaskOutcome Component', () => {
  it('Should build a TaskOutcome component', done => {
    Harness.testCreate(TaskOutcomeComponent, comp1).then(() => {
      done();
    });
  });
});
