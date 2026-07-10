import { NODE_TYPES } from '@citeck/constants/docLib';
import get from 'lodash/get';
import uniq from 'lodash/uniq';
import { useCallback, useEffect } from 'react';

import { FileItem } from '../types';

import { useDocLibDispatch } from './useDocLibDispatch';

import { openFolder, setFileViewerLastClicked, setFileViewerSelected } from '@/actions/docLib';
import { RecordActionsApi } from '@/api/recordActions';
import { ActionTypes } from '@/components/core/Records/actions/constants';

const actionApi = new RecordActionsApi();

interface UseSelectionArgs {
  stateId: string;
  isActive: boolean;
  isMobile: boolean;
  items: FileItem[];
  selected: string[];
  lastClicked: string | null;
}

/**
 * Click/selection contract of the document library:
 * plain click toggles single selection, ctrl/cmd toggles an item,
 * shift selects the range from the last clicked item, tap on mobile toggles.
 * Double click opens a folder or views a file. Escape clears the selection.
 */
export function useSelection({ stateId, isActive, isMobile, items, selected, lastClicked }: UseSelectionArgs) {
  const dispatchW = useDocLibDispatch(stateId);

  const setSelected = useCallback((ids: string[]) => dispatchW(setFileViewerSelected, ids), [dispatchW]);

  const clearSelection = useCallback(() => {
    dispatchW(setFileViewerSelected, []);
    dispatchW(setFileViewerLastClicked, null);
  }, [dispatchW]);

  const onItemClick = useCallback(
    (item: FileItem, e: React.MouseEvent) => {
      const currentId = item.id;

      if (!currentId) {
        return;
      }

      switch (true) {
        case isMobile:
        case e.ctrlKey || e.metaKey:
          if (selected.includes(currentId)) {
            setSelected(selected.filter(id => id !== currentId));
            break;
          }

          setSelected([...selected, currentId]);
          break;
        case e.shiftKey: {
          const currentIndex = items.findIndex(i => i.id === currentId);
          let lastClickedIndex = items.findIndex(i => i.id === lastClicked);
          if (lastClickedIndex === -1) {
            lastClickedIndex = 0;
          }

          const from = Math.min(currentIndex, lastClickedIndex);
          const to = Math.max(currentIndex, lastClickedIndex);

          const rangeSelected: string[] = [];
          for (let i = from; i <= to; i++) {
            rangeSelected.push(get(items, [i, 'id']));
          }

          setSelected(uniq([...selected, ...rangeSelected]));
          break;
        }
        default:
          if (selected.length === 1 && selected[0] === currentId) {
            setSelected([]);
            break;
          }

          setSelected([currentId]);
          break;
      }

      dispatchW(setFileViewerLastClicked, currentId);
    },
    [dispatchW, setSelected, isMobile, items, selected, lastClicked]
  );

  const onItemToggle = useCallback(
    (item: FileItem) => {
      if (selected.includes(item.id)) {
        setSelected(selected.filter(id => id !== item.id));
      } else {
        setSelected([...selected, item.id]);
      }

      dispatchW(setFileViewerLastClicked, item.id);
    },
    [dispatchW, setSelected, selected]
  );

  const onItemDoubleClick = useCallback(
    (item: FileItem) => {
      if (item.type === NODE_TYPES.DIR) {
        dispatchW(openFolder, item.id);
        return;
      }

      if (item.id && item.type === NODE_TYPES.FILE) {
        const localIdIdx = item.id.indexOf('$') + 1;
        actionApi.executeAction({
          records: item.id.substring(localIdIdx),
          action: { type: ActionTypes.VIEW },
          context: undefined
        });
      }
    },
    [dispatchW]
  );

  useEffect(() => {
    if (!isActive || !selected.length) {
      return;
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        clearSelection();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isActive, selected.length, clearSelection]);

  return { onItemClick, onItemToggle, onItemDoubleClick, clearSelection };
}
