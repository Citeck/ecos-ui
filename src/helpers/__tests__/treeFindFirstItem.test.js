import * as common from '../__mocks__/common';
import { treeFindFirstItem } from '../arrayOfObjects';

describe('function treeFindFirstItem', () => {
  const items = common.ITEMS; // don't mutate, else create local

  it('search by DndIdx', () => {
    const value = 2010;
    const result = treeFindFirstItem({ items, key: 'dndIdx', value });

    expect(result && result.dndIdx).toEqual(value);
  });

  it('search by ID first lvl', () => {
    const value = '10';
    const result = treeFindFirstItem({ items, key: 'id', value });

    expect(result && result.id).toBe(value);
  });

  it('not found', () => {
    const result = treeFindFirstItem({ items, key: 'id', value: '' });

    expect(result).toBeUndefined();
  });
});
