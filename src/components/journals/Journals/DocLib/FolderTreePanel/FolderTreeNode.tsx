import { NODE_TYPES } from '@citeck/constants/docLib';
import classNames from 'classnames';
import React from 'react';

import PointsLoader from '@/components/common/PointsLoader/PointsLoader';
import ChevronRight from '@/components/common/icons/ChevronRight';
import { useDropFile } from '@/hooks/useDropFile';

import { getDragStartHandler } from '../Files/utils';
import { FileItem, SidebarItem } from '../types';
import { EcosIcon } from '../ui';

interface FolderTreeNodeProps {
  item: SidebarItem;
  level: number;
  isSelected: boolean;
  children?: React.ReactNode;
  onSelect: (id: string) => void;
  onUnfold: (id: string) => void;
  onFold: (id: string) => void;
  onMove?: (data: { item: FileItem; parent: string }) => void;
}

const LEVEL_INDENT = 16;
// the inset that used to be split 8px on the panel body + 8px on the row now lives in the row alone,
// so its highlight spans the panel from border to border (COREDEV-355, QA return of 2026-09-09)
const ROW_INSET = 16;

const FolderTreeNode = ({ item, level, isSelected, children, onSelect, onUnfold, onFold, onMove }: FolderTreeNodeProps) => {
  const { id, title, hasChildren, isUnfolded, isChildrenLoading } = item;
  const dragItem = { id, title, type: NODE_TYPES.DIR };
  // The virtual library root accepts drops, but cannot itself be moved.
  const canDrag = !!onMove && !!item.parent;
  const {
    handlers,
    flags: { isAboveDir }
  } = useDropFile({
    item: dragItem,
    callback: undefined,
    setParentItem: onMove
  });

  const onToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    (isUnfolded ? onFold : onUnfold)(id);
  };

  return (
    <div className="citeck-doclib-tree__node">
      <div
        className={classNames('citeck-doclib-tree__row', {
          'citeck-doclib-tree__row_selected': isSelected,
          'citeck-doclib-tree__row_drop-target': isAboveDir
        })}
        style={{ paddingLeft: level * LEVEL_INDENT + ROW_INSET }}
        title={title}
        onClick={() => onSelect(id)}
        draggable={canDrag || undefined}
        onDragStart={canDrag ? getDragStartHandler(dragItem) : undefined}
        {...(onMove ? handlers : {})}
      >
        <span
          className={classNames('citeck-doclib-tree__toggle', {
            'citeck-doclib-tree__toggle_unfolded': isUnfolded,
            'citeck-doclib-tree__toggle_hidden': !hasChildren
          })}
          onClick={hasChildren ? onToggle : undefined}
        >
          <ChevronRight width={14} height={14} color="currentColor" />
        </span>
        <EcosIcon className="citeck-doclib-tree__folder-icon" data={{ value: 'icon-folder' }} />
        <span className="citeck-doclib-tree__title">{title}</span>
        {isChildrenLoading && <PointsLoader className="citeck-doclib-tree__points-loader" />}
      </div>
      {isUnfolded && !!children && <div className="citeck-doclib-tree__children">{children}</div>}
    </div>
  );
};

export default FolderTreeNode;
