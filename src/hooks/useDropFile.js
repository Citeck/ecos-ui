import { NODE_TYPES } from '@citeck/constants/docLib';
import get from 'lodash/get';
import { useState } from 'react';

export const useDropFile = ({ callback, setParentItem, item = {} }) => {
  const [isDragged, setIsDragged] = useState(false);
  const [isAboveDir, setAboveDir] = useState(false);

  const onDragEnter = e => {
    setIsDragged(true);
  };
  const onDragLeave = e => {
    if (e.currentTarget.contains(e.relatedTarget)) {
      return;
    }
    setIsDragged(false);
    setAboveDir(false);
  };
  const onDrop = e => {
    e.stopPropagation();
    e.preventDefault();
    setAboveDir(false);
    setIsDragged(false);

    const droppedData = e.dataTransfer.getData('application/json');

    if (droppedData) {
      let droppedItem;
      try {
        droppedItem = JSON.parse(droppedData);
      } catch {
        return;
      }
      if (
        typeof setParentItem === 'function' &&
        item.type === NODE_TYPES.DIR &&
        item.id &&
        get(droppedItem, 'id') &&
        droppedItem.id !== item.id &&
        Object.values(NODE_TYPES).includes(droppedItem.type)
      ) {
        setParentItem({ item: droppedItem, parent: item.id });
      }
    } else {
      const dataTypes = get(e, 'dataTransfer.types', []);

      if (!dataTypes.includes('Files') || typeof callback !== 'function') {
        return;
      }

      callback({ item, items: Array.from(e.dataTransfer.items), files: Array.from(e.dataTransfer.files) });
    }
  };
  const onDragOver = e => {
    // A drop target must cancel dragover itself (the folder tree has no upload wrapper).
    const types = Array.from(get(e, 'dataTransfer.types', []));
    const canMove = types.includes('application/json') && typeof setParentItem === 'function' && item.type === NODE_TYPES.DIR;
    const canUpload = types.includes('Files') && typeof callback === 'function';
    if (!canMove && !canUpload) {
      return;
    }
    e.preventDefault();

    if (item.type === NODE_TYPES.DIR) {
      setAboveDir(true);
    }
  };

  return {
    handlers: {
      onDragEnter,
      onDragLeave,
      onDrop,
      onDragOver
    },
    flags: {
      isDragged,
      isAboveDir
    }
  };
};
