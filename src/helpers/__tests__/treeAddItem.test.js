import * as common from '../__mocks__/common';
import { treeAddItem, treeFindFirstItem } from '../arrayOfObjects';

describe('function treeAddItem', () => {
  const items = common.ITEMS;

  it('add Item before by DndIdx', () => {
    const value = 555;

    const found1 = treeFindFirstItem({ items, key: 'dndIdx', value });
    expect(found1).toBeUndefined();

    const result = treeAddItem({ items, key: 'dndIdx', value: 2020, newItem: { dndIdx: value } });
    expect(result).toBe(true);

    const found2 = treeFindFirstItem({ items, key: 'dndIdx', value });
    expect(found2 && found2.dndIdx).toEqual(value);
  });

  it('nowhere to add Item', () => {
    const result = treeAddItem({ items, key: 'dndIdx', value: '', newItem: {} });
    expect(result).toBeUndefined();
  });
});
