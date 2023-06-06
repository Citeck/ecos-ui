import * as common from '../__mocks__/common';
import { treeGetItemCoords } from '../arrayOfObjects';

describe('function treeGetItemCoords', () => {
  const items = common.ITEMS; // don't mutate, else create local

  it('check on top level by DndIdx', () => {
    const value = 20;
    const found1 = treeGetItemCoords({ items, key: 'dndIdx', value });
    const found2 = items.findIndex(item => item.dndIdx === value);
    expect(found1).toEqual({ parent: 0, level: 0, index: found2 });
  });
});
