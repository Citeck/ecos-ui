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

    // The value the record was opened with belongs to the journal computed for it — which is what
    // the child asks the journal about before keeping it across the switch. Answered here rather
    // than through the journal service, so the scenario does not depend on what a query with no
    // backend behind it returns.
    child().probeRowsInJournal = async rows => rows;

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

  it('clears a value picked from the fallback journal when the expression first resolves', async () => {
    // The scenario QA returned the task on. The expression starts out empty — the field runs on the
    // static journal, and the user picks a value there. Filling in the field the expression reads
    // then produces its *first* result, so the switch looks exactly like the one a form load makes,
    // but the value left behind was picked from the journal being left and has to go.
    const component = await Harness.testCreate(SelectJournalComponent, {
      ...comp1,
      journalId: 'static-journal',
      customJournalId: 'value = data.kind === "x" ? "dyn-journal" : "";'
    });
    const child = () => component.react.innerComponent;
    const settledOn = journalId => () => !!child() && child().props.journalId === journalId && !child().state.isLoading;

    await component.react.wrapper;
    await until('the child to mount on the static journal', settledOn('static-journal'));

    // the expression is empty at first, so the static journal is the one in play
    component.checkConditions(component.root.data);
    expect(child().props.journalId).toBe('static-journal');

    // ... and the value comes from it
    component.setValue('rec-1');
    await until('the value to reach the child', () => component.dataValue === 'rec-1' && child().state.value === 'rec-1');
    await until('the child to settle on the static journal', settledOn('static-journal'));

    // the journal the expression is about to resolve to does not contain that record
    child().probeRowsInJournal = async () => [];

    component.root.data = { ...component.root.data, kind: 'x' };
    component.checkConditions(component.root.data);
    await until('the expression to resolve', () => child().props.journalId === 'dyn-journal');

    // the value goes, in the field and in formio alike — the field showing a record formio no
    // longer holds is exactly how the stale value survived a save
    await until('the switch to clear the value', () => component.dataValue === '');
    await until('the child to agree', () => child().state.value === '');
    expect(child().state.selectedRows).toEqual([]);
    expect(child().state.gridData.selected).toEqual([]);
  }, 30000);

  it('clears it in table mode too, where the stale value merely looked gone', async () => {
    // The mode QA saw as working. It only looked that way: the retained row was re-rendered through
    // the new journal's columns and came out blank, while formio went on holding the stale value —
    // the same defect, hidden by the rendering.
    const component = await Harness.testCreate(SelectJournalComponent, {
      ...comp1,
      journalId: 'static-journal',
      source: { type: 'journal', viewMode: 'table', custom: { columns: [] }, customValues: [] },
      customJournalId: 'value = data.kind === "x" ? "dyn-journal" : "";'
    });
    const child = () => component.react.innerComponent;

    await component.react.wrapper;
    await until('the child to mount on the static journal', () => !!child() && child().props.journalId === 'static-journal');

    component.setValue('rec-1');
    await until('the value to reach the child', () => component.dataValue === 'rec-1' && child().state.value === 'rec-1');

    child().probeRowsInJournal = async () => [];

    component.root.data = { ...component.root.data, kind: 'x' };
    component.checkConditions(component.root.data);
    await until('the expression to resolve', () => child().props.journalId === 'dyn-journal');

    await until('the switch to clear the value', () => component.dataValue === '');
    await until('the child to agree', () => child().state.value === '');
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
