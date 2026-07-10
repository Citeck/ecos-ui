import classNames from 'classnames';
import React from 'react';

import PointsLoader from '@/components/common/PointsLoader/PointsLoader';
import ChevronRight from '@/components/common/icons/ChevronRight';

import { SidebarItem } from '../types';
import { EcosIcon } from '../ui';

interface FolderTreeNodeProps {
  item: SidebarItem;
  level: number;
  isSelected: boolean;
  children?: React.ReactNode;
  onSelect: (id: string) => void;
  onUnfold: (id: string) => void;
  onFold: (id: string) => void;
}

const LEVEL_INDENT = 16;

const FolderTreeNode = ({ item, level, isSelected, children, onSelect, onUnfold, onFold }: FolderTreeNodeProps) => {
  const { id, title, hasChildren, isUnfolded, isChildrenLoading } = item;

  const onToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    (isUnfolded ? onFold : onUnfold)(id);
  };

  return (
    <div className="citeck-doclib-tree__node">
      <div
        className={classNames('citeck-doclib-tree__row', { 'citeck-doclib-tree__row_selected': isSelected })}
        style={{ paddingLeft: level * LEVEL_INDENT + 8 }}
        title={title}
        onClick={() => onSelect(id)}
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
