import { act, renderHook } from '@testing-library/react';

import { useDropFile } from '@/hooks/useDropFile';
import { NODE_TYPES } from '@citeck/constants/docLib';

const file = { id: 'file-id', title: 'Document.txt', type: NODE_TYPES.FILE };
const folder = { id: 'folder-id', title: 'Folder', type: NODE_TYPES.DIR };
const event = (data, types = ['application/json']) => ({
  preventDefault: jest.fn(),
  stopPropagation: jest.fn(),
  dataTransfer: { getData: () => data, types, items: [], files: [] }
});

describe('document library drops', () => {
  it('keeps the target while moving over its children and clears it immediately on leaving', () => {
    const { result } = renderHook(() => useDropFile({ item: folder, setParentItem: jest.fn() }));
    const currentTarget = document.createElement('div');
    const child = currentTarget.appendChild(document.createElement('span'));
    act(() => result.current.handlers.onDragOver(event('')));
    act(() => result.current.handlers.onDragLeave({ currentTarget, relatedTarget: child }));
    expect(result.current.flags.isAboveDir).toBe(true);
    act(() => result.current.handlers.onDragLeave({ currentTarget, relatedTarget: null }));
    expect(result.current.flags.isAboveDir).toBe(false);
  });

  it('moves a file onto the folder supplied by the target, without depending on DOM classes', () => {
    const setParentItem = jest.fn();
    const { result } = renderHook(() => useDropFile({ item: folder, setParentItem }));
    const dragOver = event('');
    act(() => result.current.handlers.onDragOver(dragOver));
    expect(dragOver.preventDefault).toHaveBeenCalled();
    expect(result.current.flags.isAboveDir).toBe(true);
    act(() => result.current.handlers.onDrop(event(JSON.stringify(file))));
    expect(setParentItem).toHaveBeenCalledWith({ item: file, parent: folder.id });
    expect(result.current.flags.isAboveDir).toBe(false);
  });

  it.each([
    ['a file', file, file],
    ['itself', folder, folder],
    ['an empty upload placeholder', { id: 'placeholder' }, file],
    ['an unrelated JSON object', folder, { id: 'other' }]
  ])('does not move onto %s', (_, item, dropped) => {
    const setParentItem = jest.fn();
    const { result } = renderHook(() => useDropFile({ item, setParentItem }));
    act(() => result.current.handlers.onDrop(event(JSON.stringify(dropped))));
    expect(setParentItem).not.toHaveBeenCalled();
  });

  it('clears the highlight and ignores malformed external JSON', () => {
    const setParentItem = jest.fn();
    const { result } = renderHook(() => useDropFile({ item: folder, setParentItem }));
    act(() => result.current.handlers.onDragOver(event('')));
    act(() => result.current.handlers.onDrop(event('{invalid')));
    expect(setParentItem).not.toHaveBeenCalled();
    expect(result.current.flags.isAboveDir).toBe(false);
  });

  it('keeps external file upload separate from internal moves', () => {
    const callback = jest.fn();
    const setParentItem = jest.fn();
    const { result } = renderHook(() => useDropFile({ item: folder, callback, setParentItem }));
    const drop = event('', ['Files']);
    drop.dataTransfer.files = [new File(['text'], 'Document.txt')];
    act(() => result.current.handlers.onDrop(drop));
    expect(callback).toHaveBeenCalledWith({ item: folder, items: [], files: drop.dataTransfer.files });
    expect(setParentItem).not.toHaveBeenCalled();
  });

  it('ignores uploads and moves when their callbacks are absent', () => {
    const { result } = renderHook(() => useDropFile({ item: folder }));
    expect(() => act(() => result.current.handlers.onDrop(event(JSON.stringify(file))))).not.toThrow();
    expect(() => act(() => result.current.handlers.onDrop(event('', ['Files'])))).not.toThrow();
  });
});
