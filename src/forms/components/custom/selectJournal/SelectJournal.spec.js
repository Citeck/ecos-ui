import Harness from '../../../test/harness';
import SelectJournalComponent from './SelectJournal';

import comp1 from './fixtures/comp1';

describe('SelectJournal Component', () => {
  it('Should build a SelectJournal component', done => {
    Harness.testCreate(SelectJournalComponent, comp1).then(() => {
      done();
    });
  });
});
