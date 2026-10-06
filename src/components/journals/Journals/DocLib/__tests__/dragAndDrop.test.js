import { fireEvent, render } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';
import { createStore } from 'redux';

import { setParentItem } from '@/actions/docLib';
import FileGridCard from '@/components/journals/Journals/DocLib/Files/FileGridCard';
import FileListRow from '@/components/journals/Journals/DocLib/Files/FileListRow';
import FolderTreeNode from '@/components/journals/Journals/DocLib/FolderTreePanel/FolderTreeNode';
import FolderTreePanel from '@/components/journals/Journals/DocLib/FolderTreePanel/FolderTreePanel';
import { wrapArgs } from '@/helpers/redux';

const transfer = () => {
  const values = {};
  return {
    types: ['application/json'],
    clearData: jest.fn(),
    setData: jest.fn((type, value) => {
      values[type] = value;
    }),
    getData: type => values[type] || ''
  };
};
const items = [
  { id: 'root', title: 'Library', hasChildren: true, isUnfolded: true },
  { id: 'parent', title: 'Parent', parent: 'root', hasChildren: true, isUnfolded: true },
  { id: 'child', title: 'Child', parent: 'parent' },
  { id: 'target', title: 'Target', parent: 'root' }
];

function renderTree() {
  const stateId = 'doclib-test';
  const store = createStore(state => state, {
    documentLibrary: { [stateId]: { sidebar: { isReady: true, items }, folderId: 'child' } }
  });
  const dispatch = jest.spyOn(store, 'dispatch');
  return {
    dispatch,
    stateId,
    ...render(
      <Provider store={store}>
        <FolderTreePanel stateId={stateId} isMobile={false} isCollapsed={false} onToggleCollapsed={() => {}} />
      </Provider>
    )
  };
}

describe('document library drag and drop', () => {
  it.each(['DIR', 'FILE'])('accepts %s on the root while keeping the root non-draggable', type => {
    const { getByText, dispatch, stateId } = renderTree();
    const dataTransfer = transfer();
    const item = { id: 'child', title: 'Child', type };
    dataTransfer.setData('application/json', JSON.stringify(item));
    const root = getByText('Library').closest('.citeck-doclib-tree__row');
    expect(root).not.toHaveAttribute('draggable');
    fireEvent.dragOver(getByText('Library'), { dataTransfer });
    expect(root).toHaveClass('citeck-doclib-tree__row_drop-target');
    expect(root).not.toHaveClass('citeck-doclib-tree__row_selected');
    fireEvent.drop(getByText('Library'), { dataTransfer });
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith(setParentItem(wrapArgs(stateId)({ item, parent: 'root' })));
    expect(root).not.toHaveClass('citeck-doclib-tree__row_drop-target');
  });

  it('moves a nested folder from the tree with its own id and scoped action', () => {
    const { getByText, dispatch, stateId } = renderTree();
    const dataTransfer = transfer();
    expect(getByText('Library').closest('[draggable]')).toBeNull();
    expect(getByText('Child').closest('[draggable]')).toHaveAttribute('draggable', 'true');
    fireEvent.dragStart(getByText('Child'), { dataTransfer });
    expect(dataTransfer.setData).toHaveBeenCalledTimes(1);
    expect(dataTransfer.effectAllowed).toBe('move');
    expect(dispatch).not.toHaveBeenCalled();

    fireEvent.dragOver(getByText('Target'), { dataTransfer });
    expect(getByText('Target').closest('.citeck-doclib-tree__row')).toHaveClass('citeck-doclib-tree__row_drop-target');
    expect(getByText('Target').closest('.citeck-doclib-tree__row')).not.toHaveClass('citeck-doclib-tree__row_selected');
    expect(getByText('Child').closest('.citeck-doclib-tree__row')).toHaveClass('citeck-doclib-tree__row_selected');
    fireEvent.drop(getByText('Target'), { dataTransfer });
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith(
      setParentItem(wrapArgs(stateId)({ item: { id: 'child', title: 'Child', type: 'DIR' }, parent: 'target' }))
    );
    expect(getByText('Target').closest('.citeck-doclib-tree__row')).not.toHaveClass('citeck-doclib-tree__row_drop-target');
  });

  it('does not bubble a drop on a child into its parent', () => {
    const { getByText, dispatch, stateId } = renderTree();
    const dataTransfer = transfer();
    const item = { id: 'file', title: 'Document.txt', type: 'FILE' };
    dataTransfer.setData('application/json', JSON.stringify(item));
    fireEvent.drop(getByText('Child'), { dataTransfer });
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith(setParentItem(wrapArgs(stateId)({ item, parent: 'child' })));
  });

  it('ignores a self drop and leaves disabled nodes non-draggable', () => {
    const { getByText, dispatch } = renderTree();
    const dataTransfer = transfer();
    fireEvent.dragStart(getByText('Child'), { dataTransfer });
    fireEvent.drop(getByText('Child'), { dataTransfer });
    expect(dispatch).not.toHaveBeenCalled();
    const { container } = render(
      <FolderTreeNode item={items[2]} level={1} isSelected={false} onSelect={() => {}} onFold={() => {}} onUnfold={() => {}} />
    );
    expect(container.querySelector('[draggable]')).toBeNull();
  });

  it.each([
    ['list', FileListRow],
    ['grid', FileGridCard]
  ])('moves from the tree to a folder in %s view', (_, Component) => {
    const { getByText } = renderTree();
    const setParent = jest.fn();
    const { getByText: getFileText } = render(
      <Component
        item={{ id: 'destination', title: 'Destination', type: 'DIR' }}
        isSelected={false}
        isLastClicked={false}
        isMobile={false}
        onClick={() => {}}
        onDoubleClick={() => {}}
        onDrop={() => {}}
        setParentItem={setParent}
      />
    );
    const dataTransfer = transfer();
    fireEvent.dragStart(getByText('Child'), { dataTransfer });
    fireEvent.dragOver(getFileText('Destination'), { dataTransfer });
    const target = getFileText('Destination').closest('.ecos-files-viewer__item');
    expect(target.className).toContain('_drop-target');
    expect(target.className).not.toContain('_selected');
    fireEvent.drop(getFileText('Destination'), { dataTransfer });
    expect(target.className).not.toContain('_drop-target');
    expect(setParent).toHaveBeenCalledWith({ item: { id: 'child', title: 'Child', type: 'DIR' }, parent: 'destination' });
  });
});
