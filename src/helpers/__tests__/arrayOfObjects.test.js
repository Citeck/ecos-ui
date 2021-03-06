import get from 'lodash/get';
import * as common from '../__mocks__/common';
import {
  treeAddItem,
  treeFindFirstItem,
  treeFindSuitableItem,
  treeGetItemCoords,
  treeGetPathItem,
  treeMoveItem,
  treeRemoveItem
} from '../arrayOfObjects';

describe('Helpers for Array of Objects / Tree', () => {
  const items = common.ITEMS; // don't mutate, else create local

  describe('function treeFindFirstItem', () => {
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

  describe('function treeGetItemCoords', () => {
    it('check on top level by DndIdx', () => {
      const value = 20;
      const found1 = treeGetItemCoords({ items, key: 'dndIdx', value });
      const found2 = items.findIndex(item => item.dndIdx === value);
      expect(found1).toEqual({ parent: 0, level: 0, index: found2 });
    });
  });

  describe('function treeGetPathItem', () => {
    it('get path and get element by path', () => {
      const value = 20201010;
      const path = treeGetPathItem({ items, key: 'dndIdx', value });
      const item = get(items, path);

      expect(item && item.dndIdx).toBe(value);
    });
  });

  describe('function treeMoveItem', () => {
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

      expect(coords).toEqual({ level: 2, parent: 0, index: 1 });
    });
  });

  describe('function treeFindSuitableItem', () => {
    it('exact value', () => {
      const value = 'exact value';
      const item = treeFindSuitableItem([{ test: value }], 'test', value);

      expect(item.test).toBe(value);
    });

    it('suitable value', () => {
      const value = 'suitable value';
      const item = treeFindSuitableItem([{ test: 'test suitable value' }], 'test', value);

      expect(item.test.includes(value)).toBeTruthy();
    });

    it('no suitable value', () => {
      const value = 'no suitable value';
      const item = treeFindSuitableItem([{ test: 'test suitable value' }], 'test', value);

      expect(item).toBeUndefined();
    });
  });
});
