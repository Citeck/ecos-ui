import classNames from 'classnames';
import get from 'lodash/get';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { initDocLib, setParentItem, uploadFiles } from '@/actions/docLib';
import Loader from '@/components/common/Loader/Loader';
import { t } from '@/helpers/export/util';
import { selectFilesViewerProps } from '@/selectors/docLib';

import DocLibService from '../DocLibService';
import { DISPLAY_MODES, DisplayMode, DocLibLabels } from '../constants';
import { useDocLibDispatch } from '../hooks/useDocLibDispatch';
import { useDocLibSelector } from '../hooks/useDocLibSelector';
import { useSelection } from '../hooks/useSelection';
import { FileItem, FileViewerState } from '../types';
import EmptyState from './EmptyState';
import FileGridView from './FileGridView';
import FileListView from './FileListView';

import './FilesArea.scss';

interface FilesAreaProps {
  stateId: string;
  isActive: boolean;
  isMobile: boolean;
  displayMode: DisplayMode;
}

const FilesArea = ({ stateId, isActive, isMobile, displayMode }: FilesAreaProps) => {
  const dispatchW = useDocLibDispatch(stateId);
  const { fileViewer, isLoading } = useDocLibSelector<{ fileViewer: FileViewerState; isLoading: boolean }>(selectFilesViewerProps, stateId);
  const [isDragged, setIsDragged] = useState(false);
  const dragDepth = useRef(0);

  const viewer: FileViewerState = fileViewer || {};
  const { hasError, isReady, items = [], selected = [], lastClicked = null } = viewer;

  const { onItemClick, onItemToggle, onItemDoubleClick, clearSelection } = useSelection({
    stateId,
    isActive,
    isMobile,
    items,
    selected,
    lastClicked
  });

  const onInitData = useCallback(() => dispatchW(initDocLib, {}), [dispatchW]);

  useEffect(() => {
    DocLibService.emitter.on(DocLibService.actionSuccessCallback, onInitData);

    return () => {
      DocLibService.emitter.off(DocLibService.actionSuccessCallback, onInitData);
    };
  }, [onInitData]);

  // rows stop drop propagation, so the drag state must be reset here as well
  const onDrop = useCallback(
    (data: unknown) => {
      dragDepth.current = 0;
      setIsDragged(false);
      dispatchW(uploadFiles, data);
    },
    [dispatchW]
  );
  const onSetParentItem = useCallback((data: unknown) => dispatchW(setParentItem, data), [dispatchW]);

  const isFilesDrag = (e: React.DragEvent) => {
    const types: readonly string[] = get(e, 'dataTransfer.types') || [];
    return types.includes('Files');
  };

  const onDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isFilesDrag(e)) {
      return;
    }

    dragDepth.current += 1;
    setIsDragged(true);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isFilesDrag(e)) {
      return;
    }

    dragDepth.current = Math.max(0, dragDepth.current - 1);

    if (dragDepth.current === 0) {
      setIsDragged(false);
    }
  };

  const onAreaDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    dragDepth.current = 0;
    setIsDragged(false);

    // internal move drops are handled by row/card targets (useDropFile)
    if (e.dataTransfer.getData('application/json')) {
      return;
    }

    if (!isFilesDrag(e)) {
      return;
    }

    onDrop({ files: Array.from(e.dataTransfer.files), items: Array.from(e.dataTransfer.items) });
  };

  const itemProps = {
    isMobile,
    onClick: onItemClick,
    onToggle: onItemToggle,
    onDoubleClick: (item: FileItem) => onItemDoubleClick(item),
    onDrop,
    setParentItem: onSetParentItem
  };

  let content: React.ReactNode;

  if (hasError) {
    content = <div className="citeck-doclib-files-area__error">{t(DocLibLabels.FETCH_ERROR)}</div>;
  } else if (!isReady && !items.length) {
    content = null;
  } else if (!items.length) {
    content = <EmptyState stateId={stateId} />;
  } else if (displayMode === DISPLAY_MODES.GRID) {
    content = <FileGridView items={items} selected={selected} lastClicked={lastClicked} {...itemProps} />;
  } else {
    content = <FileListView items={items} selected={selected} lastClicked={lastClicked} {...itemProps} />;
  }

  return (
    <div
      className={classNames('citeck-doclib-files-area', { 'citeck-doclib-files-area_dragged': isDragged })}
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onAreaDrop}
      onClick={e => {
        // click on the empty space below items clears the selection
        if (e.target === e.currentTarget) {
          clearSelection();
        }
      }}
    >
      {(isLoading || !isReady) && <Loader blur rounded />}
      {content}
      {isDragged && (
        <div className="citeck-doclib-files-area__drop-overlay">
          <i className="icon-upload" />
          <span>{t(DocLibLabels.DROP_HERE)}</span>
        </div>
      )}
    </div>
  );
};

export default FilesArea;
