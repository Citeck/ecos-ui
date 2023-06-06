import get from 'lodash/get';

import * as common from '../__mocks__/common';
import { treeGetPathItem } from '../arrayOfObjects';

describe('function treeGetPathItem', () => {
  const items = common.ITEMS; // don't mutate, else create local

  it('get path and get element by path', () => {
    const value = 20201010;
    const path = treeGetPathItem({ items, key: 'dndIdx', value });
    const item = get(items, path);

    expect(item && item.dndIdx).toBe(value);
  });
});
