import get from 'lodash/get';

import * as common from '../__mocks__/common';
import { treeGetItemCoords, treeMoveItem } from '../arrayOfObjects';

describe('function treeMoveItem', () => {
  const items = common.ITEMS; // don't mutate, else create local

  it('get path and get element by path (without element data)', () => {
    const value = undefined;
    const path = treeMoveItem({});
    const item = get(items, path);

    expect(item && item.dndIdx).toBe(value);
  });

  it('get path and get element by path (with element data)', () => {
    const value = 20201010;
    const path = treeMoveItem({
      fromId: value,
      toId: 202020,
      original: items,
      key: 'dndIdx'
    });
    const coords = treeGetItemCoords({ items: path, key: 'dndIdx', value });

    expect(coords).toEqual({ level: 2, parent: 1, index: 2 });
  });
});
