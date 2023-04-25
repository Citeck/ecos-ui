import Harness from '../../../test/harness';
import SelectJournalComponent from './SelectJournal';
import { basicSectionTest } from '../../../test/builder/helpers';

import comp1 from './fixtures/comp1';
import comp2 from './fixtures/comp2';

basicSectionTest(SelectJournalComponent);

describe('SelectJournal Component', () => {
  it('Should build a SelectJournal component', done => {
    Harness.testCreate(SelectJournalComponent, comp1).then(() => {
      done();
    });
  });

  it('Should be correctId with no default journalId', done => {
    Harness.testCreate(SelectJournalComponent, comp1).then(async component => {
      component.root.data = { ...component.root.data, var1: '1', var2: '2', var3: '3' };
      const wrapper = await component.react.wrapper;
      expect(wrapper.props.props.journalId).toBe('');
      done();
    });
  });

  it('Should be correctId with templateJournalId', done => {
    Harness.testCreate(SelectJournalComponent, comp2).then(async component => {
      component.root.data = { ...component.root.data, var1: '1', var2: '2', var3: '3' };
      const wrapper = await component.react.wrapper;
      expect(wrapper.props.props.journalId).toBe('template-1-2-1-3');
      done();
    });
  });
});
