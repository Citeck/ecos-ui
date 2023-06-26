import * as common from '../__mocks__/common';
import { treeFindFirstItem, treeRemoveItem } from '../arrayOfObjects';

describe('function treeRemoveItem', () => {
  const items = common.ITEMS;

  it('delete by DndIdx', () => {
    const value = 2010;

    const found1 = treeFindFirstItem({ items, key: 'dndIdx', value });
    expect(found1 && found1.dndIdx).toEqual(value);

    const result = treeRemoveItem({ items, key: 'dndIdx', value });
    expect(result && result.dndIdx).toEqual(value);

    const found2 = treeFindFirstItem({ items, key: 'dndIdx', value });
    expect(found2).toBeUndefined();
  });

  it('nothing to delete by DndIdx', () => {
    const result = treeRemoveItem({ items, key: 'dndIdx', value: '' });
    expect(result).toBeUndefined();
  });
});
