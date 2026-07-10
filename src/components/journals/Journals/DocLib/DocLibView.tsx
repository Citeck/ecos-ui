import { JournalUrlParams } from '@citeck/constants';
import classNames from 'classnames';
import get from 'lodash/get';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import DocLibBreadcrumbs from './Breadcrumbs/DocLibBreadcrumbs';
import FilesArea from './Files/FilesArea';
import FolderTreePanel from './FolderTreePanel/FolderTreePanel';
import SelectionBar from './SelectionBar/SelectionBar';
import DocLibToolbar from './Toolbar/DocLibToolbar';
import { useDisplayMode } from './hooks/useDisplayMode';
import { useDocLibDispatch } from './hooks/useDocLibDispatch';
import { useDocLibSelector } from './hooks/useDocLibSelector';
import { FileViewerState } from './types';

import { initDocLib, loadFilesViewerData, setFileViewerPagination } from '@/actions/docLib';
import Pagination from '@/components/common/Pagination/Pagination';
import { PAGINATION_SIZES, isDocLib } from '@/components/journals/Journals/constants';
import { getSearchParams } from '@/helpers/urls';
import { selectDocLibFileViewer, selectDocLibPageProps } from '@/selectors/docLib';
import { selectViewMode } from '@/selectors/journals';

import './DocLib.scss';

const LS_TREE_COLLAPSED_KEY = 'docLibTreeCollapsed';

interface DocLibPageProps {
  isEnabled: boolean;
  folderTitle: string;
  typeRef: string | null;
  isLoading: boolean;
}

interface DocLibViewProps {
  stateId: string;
  isActivePage: boolean;
  bodyClassName?: string;
  Header: React.ComponentType<{ title?: string; hasBtnMenu?: boolean; configRec?: unknown }>;
  UnavailableView: React.ComponentType;
}

const DocLibView = (props: DocLibViewProps) => {
  const { stateId, isActivePage, bodyClassName, Header, UnavailableView } = props;

  const dispatchW = useDocLibDispatch(stateId);
  const viewMode = useDocLibSelector<string | undefined>(selectViewMode, stateId);
  const isMobile: boolean = useSelector(state => get(state, 'view.isMobile', false));
  const { isEnabled, folderTitle, typeRef, isLoading } = useDocLibSelector<DocLibPageProps>(selectDocLibPageProps, stateId);
  const fileViewer = useDocLibSelector<FileViewerState>(selectDocLibFileViewer, stateId);

  const selected: string[] = get(fileViewer, 'selected') || [];
  const total: number = get(fileViewer, 'total') || 0;
  const isViewerReady: boolean = get(fileViewer, 'isReady', false);
  const pagination = get(fileViewer, 'pagination');

  const { displayMode, setDisplayMode } = useDisplayMode(isMobile);

  const [isInitialized, setIsInitialized] = useState(false);
  const initializedTypeRef = useRef<string | null>(null);

  const [isTreeCollapsed, setIsTreeCollapsed] = useState(() => {
    try {
      return localStorage.getItem(LS_TREE_COLLAPSED_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [isMobileTreeOpen, setIsMobileTreeOpen] = useState(false);

  const isDocLibMode = isDocLib(viewMode);

  useEffect(() => {
    const urlViewMode = get(getSearchParams(), JournalUrlParams.VIEW_MODE);

    if (!isActivePage || !isDocLib(urlViewMode)) {
      return;
    }

    if (typeRef && initializedTypeRef.current !== typeRef) {
      initializedTypeRef.current = typeRef;
      setIsInitialized(true);
      dispatchW(initDocLib, {});
    }
  }, [typeRef, isActivePage, viewMode, dispatchW]);

  const onToggleTreeCollapsed = useCallback(() => {
    setIsTreeCollapsed(collapsed => {
      try {
        localStorage.setItem(LS_TREE_COLLAPSED_KEY, String(!collapsed));
      } catch {
        // ignore persistence errors
      }
      return !collapsed;
    });
  }, []);

  const onToggleMobileTree = useCallback(() => setIsMobileTreeOpen(open => !open), []);

  const onChangePagination = useCallback(
    (page: { skipCount: number; maxItems: number; page: number }) => {
      dispatchW(setFileViewerPagination, page);
      dispatchW(loadFilesViewerData);
    },
    [dispatchW]
  );

  if (!isInitialized) {
    return null;
  }

  const showTree = !isMobile || isMobileTreeOpen;
  const showSelectionBar = selected.length >= 2;

  return (
    <div hidden={!isDocLibMode} className={classNames('citeck-doclib', bodyClassName, { 'citeck-doclib_mobile': isMobile })}>
      <Header title={folderTitle} hasBtnMenu={false} />

      {!isEnabled && !isLoading && <UnavailableView />}

      {(isEnabled || isLoading) && (
        <div className="citeck-doclib__layout">
          {showTree && (
            <FolderTreePanel
              stateId={stateId}
              isMobile={isMobile}
              isCollapsed={isTreeCollapsed}
              onToggleCollapsed={onToggleTreeCollapsed}
              onFolderOpen={isMobile ? () => setIsMobileTreeOpen(false) : undefined}
            />
          )}
          {isMobile && isMobileTreeOpen && <div className="citeck-doclib__backdrop" onClick={() => setIsMobileTreeOpen(false)} />}

          <div className="citeck-doclib__main">
            <DocLibToolbar
              stateId={stateId}
              isMobile={isMobile}
              displayMode={displayMode}
              setDisplayMode={setDisplayMode}
              onToggleTree={isMobile ? onToggleMobileTree : undefined}
            />

            <div className="citeck-doclib__context-bar">
              {showSelectionBar ? (
                <SelectionBar stateId={stateId} isMobile={isMobile} selectedCount={selected.length} />
              ) : (
                <DocLibBreadcrumbs stateId={stateId} />
              )}

              <Pagination
                className="citeck-doclib__pagination"
                total={total}
                sizes={PAGINATION_SIZES}
                hasPageSize
                loading={!isViewerReady}
                onChange={onChangePagination}
                {...(pagination || {})}
              />
            </div>

            <FilesArea stateId={stateId} isActive={isActivePage && isDocLibMode} isMobile={isMobile} displayMode={displayMode} />
          </div>
        </div>
      )}
    </div>
  );
};

export default DocLibView;
