import { getRowActions } from '../DevModulesGrid';

// Row ids are record refs of ecos modules; a STRING lodash path would be split on the dot in the
// local id and no action would ever be found (COREDEV-492).
const rowId = 'uiserv/form@some.form';

describe('DevModulesGrid.getRowActions', () => {
  it('finds the actions of a record ref with a dot', () => {
    const rowActions = [{ id: 'delete', name: 'Delete' }];

    expect(getRowActions({ forRecord: { [rowId]: rowActions } }, rowId)).toBe(rowActions);
  });

  it('returns an empty array when there are no actions for the record', () => {
    expect(getRowActions({ forRecord: {} }, rowId)).toEqual([]);
    expect(getRowActions(undefined, rowId)).toEqual([]);
  });
});
