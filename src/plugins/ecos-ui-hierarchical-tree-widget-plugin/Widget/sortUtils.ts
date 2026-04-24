import isString from 'lodash/isString';

import type { TreeNode } from './TreeNode';

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

export const sortNodesByName = <T extends TreeNode['children']>(nodes: T): T => {
  return ([...nodes] as T).sort((a, b) => {
    const nameA = isString(a) ? a : a.name || '';
    const nameB = isString(b) ? b : b.name || '';
    return collator.compare(nameA, nameB);
  }) as T;
};
