import classNames from 'classnames';
import get from 'lodash/get';
import React, { useCallback, useMemo } from 'react';

import { foldSidebarItem, openFolder, unfoldSidebarItem } from '@/actions/docLib';
import Loader from '@/components/common/Loader/Loader';
import ChevronRight from '@/components/common/icons/ChevronRight';
import { compareAZ } from '@/helpers/docLib';
import { t } from '@/helpers/export/util';
import { selectDocLibFolderId, selectDocLibSidebar } from '@/selectors/docLib';

import { DocLibLabels } from '../constants';
import { useDocLibDispatch } from '../hooks/useDocLibDispatch';
import { useDocLibSelector } from '../hooks/useDocLibSelector';
import { SidebarItem, SidebarState } from '../types';
import FolderTreeNode from './FolderTreeNode';

import './FolderTreePanel.scss';

interface FolderTreePanelProps {
  stateId: string;
  isMobile: boolean;
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
  onFolderOpen?: () => void;
}

const FolderTreePanel = ({ stateId, isMobile, isCollapsed, onToggleCollapsed, onFolderOpen }: FolderTreePanelProps) => {
  const dispatchW = useDocLibDispatch(stateId);
  const sidebar = useDocLibSelector<SidebarState>(selectDocLibSidebar, stateId);
  const selected = useDocLibSelector<string | null>(selectDocLibFolderId, stateId) || null;

  const { isReady, hasError } = sidebar;
  const items: SidebarItem[] = get(sidebar, 'items') || [];

  const childrenByParent = useMemo(() => {
    const map = new Map<string | null, SidebarItem[]>();

    items.forEach(item => {
      const parent = item.parent || null;
      const children = map.get(parent) || [];
      children.push(item);
      map.set(parent, children);
    });

    map.forEach(children => children.sort(compareAZ));

    return map;
  }, [items]);

  const onSelect = useCallback(
    (id: string) => {
      dispatchW(openFolder, id);
      onFolderOpen && onFolderOpen();
    },
    [dispatchW, onFolderOpen]
  );

  const onUnfold = useCallback((id: string) => dispatchW(unfoldSidebarItem, id), [dispatchW]);
  const onFold = useCallback((id: string) => dispatchW(foldSidebarItem, id), [dispatchW]);

  const renderLevel = (parent: string | null, level: number): React.ReactNode => {
    const children = childrenByParent.get(parent) || [];

    return children.map(item => (
      <FolderTreeNode
        key={item.id}
        item={item}
        level={level}
        isSelected={item.id === selected}
        onSelect={onSelect}
        onUnfold={onUnfold}
        onFold={onFold}
      >
        {item.isUnfolded ? renderLevel(item.id, level + 1) : null}
      </FolderTreeNode>
    ));
  };

  let content: React.ReactNode;

  if (hasError) {
    content = <div className="citeck-doclib-tree__message">{t(DocLibLabels.FETCH_ERROR)}</div>;
  } else if (!isReady) {
    content = <Loader blur rounded style={{ position: 'relative', margin: '0.5em 0' }} />;
  } else if (!items.length) {
    content = <div className="citeck-doclib-tree__message">{t(DocLibLabels.NO_FOLDERS)}</div>;
  } else {
    content = <div className="citeck-doclib-tree">{renderLevel(null, 0)}</div>;
  }

  if (isCollapsed && !isMobile) {
    return (
      <div className="citeck-doclib-panel citeck-doclib-panel_collapsed" onClick={onToggleCollapsed} title={t(DocLibLabels.FOLDERS_EXPAND)}>
        <span className="citeck-doclib-panel__collapse-btn">
          <ChevronRight width={14} height={14} color="currentColor" />
        </span>
      </div>
    );
  }

  return (
    <div className={classNames('citeck-doclib-panel', { 'citeck-doclib-panel_mobile': isMobile })}>
      <div className="citeck-doclib-panel__header">
        <span className="citeck-doclib-panel__title">{t(DocLibLabels.FOLDERS_TITLE)}</span>
        <span
          className="citeck-doclib-panel__collapse-btn citeck-doclib-panel__collapse-btn_expanded"
          title={t(DocLibLabels.FOLDERS_COLLAPSE)}
          onClick={onToggleCollapsed}
        >
          <ChevronRight width={14} height={14} color="currentColor" />
        </span>
      </div>
      <div className="citeck-doclib-panel__body">{content}</div>
    </div>
  );
};

export default FolderTreePanel;
