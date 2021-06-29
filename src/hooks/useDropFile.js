import { useEffect, useState, useCallback } from 'react';
import get from 'lodash/get';
import debounce from 'lodash/debounce';

import { NODE_TYPES } from '../constants/docLib';

export const useDropFile = ({ callback, item = {} }) => {
  const [isDragged, setIsDragged] = useState(false);
  const [isAboveDir, setAboveDir] = useState(false);

  const _debouncedLeave = useCallback(
    debounce(() => {
      if (item.type === NODE_TYPES.DIR) {
        setAboveDir(false);
      }
    }, 100),
    []
  );

  const onDragEnter = e => {
    e.stopPropagation();
    e.preventDefault();

    setIsDragged(true);
  };
  const onDragLeave = e => {
    e.stopPropagation();
    e.preventDefault();

    setIsDragged(false);
    _debouncedLeave();
  };
  const onDrop = e => {
    e.stopPropagation();
    e.preventDefault();

    const dataTypes = get(e, 'dataTransfer.types', []);

    setAboveDir(false);
    setIsDragged(false);

    if (!dataTypes.includes('Files')) {
      return;
    }

    callback({ item, files: Array.from(e.dataTransfer.files) });
  };
  const onDragOver = e => {
    e.stopPropagation();
    e.preventDefault();

    _debouncedLeave.cancel();

    if (item.type === NODE_TYPES.DIR) {
      setAboveDir(true);
    }
  };

  useEffect(() => {
    return () => {
      _debouncedLeave.cancel();
    };
  }, []);

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
