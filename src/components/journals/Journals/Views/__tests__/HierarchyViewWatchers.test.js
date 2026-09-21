import Records from '@citeck/records-core';
import { render } from '@testing-library/react';
import React from 'react';

import { TreeNodeRow } from '../HierarchyView';

// FormManager pulls in EcosForm and the record actions import cycle; the row only opens dialogs through it.
jest.mock('@/components/forms/EcosForm/FormManager', () => ({ __esModule: true, default: { openFormModal: () => {} } }));

// Records.get(ref) is a global cache: the record (and its watcher list) outlives every row rendered
// for it, so a `_disp` watcher that is never removed piles up on each render of the tree (COREDEV-522).
describe('HierarchyView TreeNodeRow record watchers', () => {
  const nodeA = 'emodel/doc@hierarchy-a';
  const nodeB = 'emodel/doc@hierarchy-b';
  const watchers = id => Records.get(id)._watchers.length;
  const row = id => (
    <TreeNodeRow
      node={{ id, name: id }}
      tree={{}}
      expanded={{}}
      selectedId=""
      permissionsById={{}}
      onToggle={() => {}}
      onClick={() => {}}
      onReload={() => {}}
      onDragStartNode={() => {}}
      onDragEndNode={() => {}}
    />
  );

  it('watches the display name while mounted and stops on unmount', () => {
    const wrapper = render(row(nodeA));
    expect(watchers(nodeA)).toBe(1);

    wrapper.unmount();
    expect(watchers(nodeA)).toBe(0);
  });

  it('moves the watcher to the new record when the row is reused for another node', () => {
    const wrapper = render(row(nodeA));
    wrapper.rerender(row(nodeB));

    expect(watchers(nodeA)).toBe(0);
    expect(watchers(nodeB)).toBe(1);

    wrapper.unmount();
    expect(watchers(nodeB)).toBe(0);
  });

  it('does not pile up watchers when the tree is rendered again and again', () => {
    for (let i = 0; i < 5; i++) {
      render(row(nodeA)).unmount();
    }

    expect(watchers(nodeA)).toBe(0);
  });
});
