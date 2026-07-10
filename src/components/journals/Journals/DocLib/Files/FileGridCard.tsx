import classNames from 'classnames';
import React from 'react';

import { renderAction } from '@/components/common/grid/InlineTools/helpers';
import { useDropFile } from '@/hooks';

import { FileItemViewProps } from './FileListRow';
import { DROP_TARGET_CLASS, FileItemIcon, formatModified, getDragStartHandler } from './utils';

const FileGridCard = ({
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
      className={classNames('citeck-doclib-files__card', DROP_TARGET_CLASS, {
        'citeck-doclib-files__card_selected': isSelected || isAboveDir,
        'citeck-doclib-files__card_last-clicked': isLastClicked,
        'citeck-doclib-files__card_mobile': isMobile
      })}
      data-id={item.id}
      draggable
      onDragStart={getDragStartHandler(item)}
      onClick={e => onClick(item, e)}
      onDoubleClick={() => onDoubleClick(item)}
      {...handlers}
    >
      <span
        className={classNames('citeck-doclib-files__checkbox citeck-doclib-files__card-checkbox', {
          'citeck-doclib-files__checkbox_checked': isSelected
        })}
        onClick={onCheckboxClick}
        onDoubleClick={e => e.stopPropagation()}
      >
        <i className={isSelected ? 'icon-custom-checkbox-filled-checked' : 'icon-custom-checkbox-outline-unchecked'} />
      </span>

      <div className="citeck-doclib-files__card-actions" onClick={e => e.stopPropagation()} onDoubleClick={e => e.stopPropagation()}>
        {(item.actions || []).map((action, idx) => renderAction(action, idx))}
      </div>

      <div className="citeck-doclib-files__card-preview">
        <FileItemIcon item={item} className="citeck-doclib-files__card-icon" />
      </div>

      <div className="citeck-doclib-files__card-info">
        <span className="citeck-doclib-files__card-title" title={item.title}>
          {item.title}
        </span>
        <span className="citeck-doclib-files__card-modified">{formatModified(item.modified)}</span>
      </div>
    </div>
  );
};

export default FileGridCard;
