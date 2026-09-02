import classNames from 'classnames';
import React, { useCallback } from 'react';

import { loadFilesViewerData, startSearch } from '@/actions/docLib';
import { Search, Tooltip } from '@/components/common';
import { IcoBtn } from '@/components/common/btns';
import { Dropdown } from '@/components/common/form';
import { t } from '@/helpers/export/util';
import { selectDocLibCreateVariants, selectDocLibSearchText } from '@/selectors/docLib';

import ViewTabs from '../../ViewTabs';
import { DISPLAY_MODES, DisplayMode, DocLibLabels } from '../constants';
import { useCreateDialog } from '../hooks/useCreateDialog';
import { useDocLibDispatch } from '../hooks/useDocLibDispatch';
import { useDocLibSelector } from '../hooks/useDocLibSelector';
import { CreateVariant } from '../types';

import './DocLibToolbar.scss';

interface DocLibToolbarProps {
  stateId: string;
  isMobile: boolean;
  displayMode: DisplayMode;
  setDisplayMode: (mode: DisplayMode) => void;
  onToggleTree?: () => void;
}

const DocLibToolbar = ({ stateId, isMobile, displayMode, setDisplayMode, onToggleTree }: DocLibToolbarProps) => {
  const dispatchW = useDocLibDispatch(stateId);
  const createVariants = useDocLibSelector<CreateVariant[]>(selectDocLibCreateVariants, stateId);
  const searchText = useDocLibSelector<string>(selectDocLibSearchText, stateId) || '';

  const { openCreateForm } = useCreateDialog(stateId);

  const onRefresh = useCallback(() => dispatchW(loadFilesViewerData), [dispatchW]);
  const onSearch = useCallback((text: string) => dispatchW(startSearch, text), [dispatchW]);

  const renderCreate = () => {
    if (!createVariants || !createVariants.length) {
      return null;
    }

    const createBtn = (onClick?: () => void) => (
      <IcoBtn
        icon="icon-small-plus"
        className={classNames('citeck-doclib-toolbar__create-btn', {
          'citeck-doclib-toolbar__create-btn_mobile': isMobile
        })}
        onClick={onClick}
      >
        {!isMobile && t(DocLibLabels.CREATE)}
      </IcoBtn>
    );

    if (createVariants.length === 1) {
      return createBtn(() => openCreateForm(createVariants[0]));
    }

    return (
      <Dropdown
        hasEmpty
        isButton
        source={createVariants}
        keyFields="key"
        valueField="key"
        titleField="name"
        menuClassName="citeck-doclib-toolbar__create-menu"
        onChange={openCreateForm}
      >
        {createBtn()}
      </Dropdown>
    );
  };

  return (
    <div className={classNames('citeck-doclib-toolbar', { 'citeck-doclib-toolbar_mobile': isMobile })}>
      {isMobile && !!onToggleTree && <IcoBtn icon="icon-folder-2" className="citeck-doclib-toolbar__icon-btn" onClick={onToggleTree} />}

      {renderCreate()}

      <Search className="citeck-doclib-toolbar__search" onSearch={onSearch} collapsed={isMobile} text={searchText} cleaner />

      <Tooltip off={isMobile} target="citeck-doclib-toolbar-refresh" text={t(DocLibLabels.REFRESH)} uncontrolled>
        <IcoBtn id="citeck-doclib-toolbar-refresh" icon="icon-reload" className="citeck-doclib-toolbar__icon-btn" onClick={onRefresh} />
      </Tooltip>

      <div className="citeck-doclib-toolbar__right">
        <div className="citeck-doclib-toolbar__display-mode">
          <Tooltip off={isMobile} target="citeck-doclib-display-list" text={t(DocLibLabels.VIEW_LIST)} uncontrolled>
            <IcoBtn
              id="citeck-doclib-display-list"
              icon="icon-list"
              className={classNames('citeck-doclib-toolbar__display-mode-btn', {
                'citeck-doclib-toolbar__display-mode-btn_active': displayMode === DISPLAY_MODES.LIST
              })}
              onClick={() => setDisplayMode(DISPLAY_MODES.LIST)}
            />
          </Tooltip>
          <Tooltip off={isMobile} target="citeck-doclib-display-grid" text={t(DocLibLabels.VIEW_GRID)} uncontrolled>
            <IcoBtn
              id="citeck-doclib-display-grid"
              icon="icon-tiles"
              className={classNames('citeck-doclib-toolbar__display-mode-btn', {
                'citeck-doclib-toolbar__display-mode-btn_active': displayMode === DISPLAY_MODES.GRID
              })}
              onClick={() => setDisplayMode(DISPLAY_MODES.GRID)}
            />
          </Tooltip>
        </div>

        <ViewTabs stateId={stateId} />
      </div>
    </div>
  );
};

export default DocLibToolbar;
