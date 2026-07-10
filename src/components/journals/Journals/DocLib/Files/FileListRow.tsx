import classNames from 'classnames';
import React from 'react';

import { renderAction } from '@/components/common/grid/InlineTools/helpers';
import { useDropFile } from '@/hooks';

import { FileItem } from '../types';
import { DROP_TARGET_CLASS, FileItemIcon, formatModified, getDragStartHandler } from './utils';

export interface FileItemViewProps {
  item: FileItem;
  isSelected: boolean;
  isLastClicked: boolean;
  isMobile: boolean;
  onClick: (item: FileItem, e: React.MouseEvent) => void;
  onToggle: (item: FileItem) => void;
  onDoubleClick: (item: FileItem) => void;
  onDrop: (data: unknown) => void;
  setParentItem: (data: unknown) => void;
}

const FileListRow = ({
  item,
  isSelected,
  isLastClicked,
  isMobile,
  onClick,
  onToggle,
  onDoubleClick,
  onDrop,
  setParentItem
}: FileItemViewProps) => {
  const {
    flags: { isAboveDir },
    handlers
  } = useDropFile({ item, callback: onDrop, setParentItem });

  const onCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggle(item);
  };

  return (
    <div
      className={classNames('citeck-doclib-files__row', DROP_TARGET_CLASS, {
        'citeck-doclib-files__row_selected': isSelected || isAboveDir,
        'citeck-doclib-files__row_last-clicked': isLastClicked,
        'citeck-doclib-files__row_mobile': isMobile
      })}
      data-id={item.id}
      draggable
      onDragStart={getDragStartHandler(item)}
      onClick={e => onClick(item, e)}
      onDoubleClick={() => onDoubleClick(item)}
      {...handlers}
    >
      <span
        className={classNames('citeck-doclib-files__checkbox', { 'citeck-doclib-files__checkbox_checked': isSelected })}
        onClick={onCheckboxClick}
        onDoubleClick={e => e.stopPropagation()}
      >
        <i className={isSelected ? 'icon-custom-checkbox-filled-checked' : 'icon-custom-checkbox-outline-unchecked'} />
      </span>

      <div className="citeck-doclib-files__row-name">
        <FileItemIcon item={item} className="citeck-doclib-files__row-icon" />
        <span className="citeck-doclib-files__row-title" title={item.title}>
          {item.title}
        </span>
      </div>

      <span className="citeck-doclib-files__row-modified">{formatModified(item.modified)}</span>

      <div className="citeck-doclib-files__row-actions" onClick={e => e.stopPropagation()} onDoubleClick={e => e.stopPropagation()}>
        {(item.actions || []).map((action, idx) => renderAction(action, idx))}
      </div>
    </div>
  );
};

export default FileListRow;
