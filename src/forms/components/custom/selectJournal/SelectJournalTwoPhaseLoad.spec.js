import { waitFor } from '@testing-library/react';

import Harness from '../../../test/harness';

import SelectJournalComponent from './SelectJournal';
import comp1 from './fixtures/comp1';

// Kept in its own file: the scenario drives real timers (the props push is debounced by 250ms with a
// 500ms maxWait, and the child resolves display names asynchronously) and would otherwise be the
// test that happens to be running when a promise left behind by one of the faster tests in
// SelectJournal.spec.js rejects.
describe('SelectJournal Component — dynamic journalId across the two-phase form load', () => {
  const until = (what, predicate) =>
    waitFor(
      () => {
        if (!predicate()) {
          throw new Error(`Still waiting for ${what}`);
        }
      },
      { timeout: 8000, interval: 25 }
    );

  it('keeps the loaded value when the expression resolves after the form data arrives', async () => {
    // EcosForm builds the form before it loads the record (`Formio.createForm` first,
    // `form.setValue({ data })` after), so an expression reading the record's own data resolves
    // only once the child is already mounted on the static journalId.
    const component = await Harness.testCreate(SelectJournalComponent, {
      ...comp1,
      journalId: 'static-journal',
      customJournalId: 'value = data.kind === "x" ? "dyn-journal" : (data.kind === "y" ? "other-journal" : "");'
    });
    const child = () => component.react.innerComponent;
    // The child fetches display names for every value it is given; waiting for it to go idle keeps
    // an in-flight fetch from landing on top of the next step and resurrecting a cleared value.
    const settledOn = journalId => () => !!child() && child().props.journalId === journalId && !child().state.isLoading;

    await component.react.wrapper;
    await until('the child to mount on the static journal', settledOn('static-journal'));

    // the record's value, as `form.setValue` delivers it
    component.setValue('rec-1');
    await until('the record value to reach the child', () => component.dataValue === 'rec-1' && child().state.value === 'rec-1');
    await until('the child to settle on the static journal', settledOn('static-journal'));

    // ... and now the data the expression depends on arrives
    component.root.data = { ...component.root.data, kind: 'x' };
    component.checkConditions(component.root.data);
    await until('the expression to resolve', settledOn('dyn-journal'));

    expect(component.dataValue).toBe('rec-1');
    expect(child().state.value).toBe('rec-1');
    // the journal we left takes its config and rows with it — nothing else would refetch them
    expect(child().state.isJournalConfigFetched).toBe(false);

    // a later switch is a real journal change: the selected record belongs to the journal we left
    component.root.data = { ...component.root.data, kind: 'y' };
    component.checkConditions(component.root.data);
    await until('the journal to switch again', settledOn('other-journal'));
    await until('the switch to clear the value', () => component.dataValue === '');

    // the child must agree with formio — an in-flight display-name fetch from the previous journal
    // resolving late would put the record back on screen while formio's data stays empty
    expect(child().state.value).toBe('');
    expect(child().state.selectedRows).toEqual([]);
  }, 30000);

  it('keeps a value whose display names are still being resolved when the expression resolves', async () => {
    // The realistic ordering: `form.setValue` hands the record's value to the child, and the
    // expression resolves while the child is still several requests deep into rendering it.
    const component = await Harness.testCreate(SelectJournalComponent, {
      ...comp1,
      journalId: 'static-journal',
      customJournalId: 'value = data.kind === "x" ? "dyn-journal" : (data.kind === "y" ? "other-journal" : "");'
    });
    const child = () => component.react.innerComponent;

    await component.react.wrapper;
    await until('the child to mount on the static journal', () => !!child() && child().props.journalId === 'static-journal');

    // hold the display-name resolution open, so the value is still in flight during the switch
    let releaseDisplayNames;
    const originalFetchDisplayNames = child().fetchDisplayNames;
    child().fetchDisplayNames = rows =>
      new Promise(resolve => {
        releaseDisplayNames = () => resolve(originalFetchDisplayNames(rows));
      });

    component.setValue('rec-1');
    await until('the child to start resolving the value', () => !!releaseDisplayNames);

    // the expression resolves mid-flight — this switch keeps the value, so the chain must survive
    component.root.data = { ...component.root.data, kind: 'x' };
    component.checkConditions(component.root.data);
    await until('the expression to resolve', () => child().props.journalId === 'dyn-journal');

    releaseDisplayNames();
    await until('the value to land on the new journal', () => child().state.value === 'rec-1');

    expect(component.dataValue).toBe('rec-1');
    expect(child().state.isLoading).toBe(false);
  }, 30000);
});
