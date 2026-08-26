import { JournalUrlParams as JUP } from '@citeck/constants/index';
import { ParserPredicate } from '@citeck/records-predicates';
import classNames from 'classnames';
import get from 'lodash/get';
import isBoolean from 'lodash/isBoolean';
import isEmpty from 'lodash/isEmpty';
import React, { useEffect, useMemo, useRef, useState } from 'react';

import Export from '@/components/domain/Export/Export';
import Import from '@/components/domain/Import';
import { Search, Tooltip } from '@/components/common';
import { IcoBtn } from '@/components/common/btns';
import ExportIcon from '@/components/common/icons/Export';
import Filter from '@/components/common/icons/Filter';
import ImportIcon from '@/components/common/icons/Import';
import Menu from '@/components/common/icons/Menu';
import Repeat from '@/components/common/icons/Repeat';
import Setting from '@/components/common/icons/Setting';
import Shape from '@/components/common/icons/Shape';
import GroupActions from '../GroupActions';
import { JournalsPresetListDropdown } from '../JournalsPresets';
import ViewTabs from '../ViewTabs';
import { isKanban, isPreviewList } from '@/components/journals/Journals/constants';

import CreateMenu from './CreateMenu';
import OverflowMenu from './OverflowMenu';

import { getSearchParams } from '@/helpers/urls';
import { getBool, t } from '@/helpers/util';
import WidgetService from '@/services/WidgetService';
import './JournalsSettingsBar.scss';

const Labels = {
  BTN_CREATE: 'journals.bar.btn.create',
  BTN_TABLE_SETTINGS: 'journals.bar.btn.settings-table',
  BTN_JOURNAL_SETTINGS: 'journals.bar.btn.settings-journal',
  BTN_KANBAN_SETTINGS: 'journals.bar.btn.settings-kanban',
  BTN_WIDGET_SETTINGS: 'widgets-settings.modal.title',
  BTN_EXPORT: 'journals.bar.btn.export',
  BTN_IMPORT: 'journals.bar.btn.import',
  BTN_UPDATE: 'journals.bar.btn.update',
  BTN_FILTER_DEL: 'journals.bar.btn.filter-del',
  BTN_TOGGLE_MENU: 'journals.bar.btn.toggle-menu'
};

const tooltipModifiers = {
  name: 'offset',
  enabled: true,
  options: {
    offset: [0, 10]
  }
};

const JournalsSettingsBar = ({
  stateId,
  targetId,
  grid,
  journalConfig,
  journalSetting,
  predicate,
  searchText,
  selectedRecords,
  viewMode,

  isLoading,
  isRefreshing,
  isMobile,
  isCreateLoading,
  isShowResetFilter,
  noGroupActions,

  leftChild,
  rightChild,

  nameBtnSettings,

  onRefresh,
  onSearch,
  onToggleSettings,
  onAddRecord,
  onResetFilter,

  onToggleMenu,
  hasBtnMenu,
  onEditJournal,
  hasBtnEdit,
  hasWritePermission,
  rightBarChild,

  hideActionsBtn = false,
  hideSettingsJournalBtn = false,
  hidePresetsBtn = false,
  hideImportBtn = false,
  hideExportBtn = false
}) => {
  const journalSettingsBarRef = useRef(null);
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [isHideTextPagination, setIsHideTextPagination] = React.useState(false);
  const showWidgets = getBool(get(getSearchParams(), JUP.VIEW_WIDGET_PREVIEW));
  const [isOpenDropdownExport, setIsOpenDropdownExport] = useState(false);
  const [isOpenDropdownImport, setIsOpenDropdownImport] = useState(false);
  const grey = 'ecos-btn_i ecos-btn_grey ecos-btn_bgr-inherit ecos-btn_width_auto ecos-btn_hover_t-light-blue';
  const createVariants = get(journalConfig, 'meta.createVariants') || [];
  const headerSearchEnabled = get(journalConfig, 'searchConfig.headerSearchEnabled', true);
  const noCreateMenu = isMobile || isEmpty(createVariants);
  const isDefaultSettings = useMemo(() => isEmpty(ParserPredicate.getFlatFilters(predicate)), [stateId, targetId, predicate, viewMode]);
  const tooltipSettings = {
    off: isMobile,
    modifiers: [tooltipModifiers],
    uncontrolled: true
  };

  useEffect(() => {
    const el = journalSettingsBarRef.current;
    if (!el) {
      return;
    }

    const ro = new ResizeObserver(entries => {
      if (entries && entries[0]) {
        if (entries[0].contentRect.width > 1002) {
          setIsCollapsed(false);
        } else {
          setIsCollapsed(true);
        }

        if (entries[0].contentRect.width < 630) {
          setIsHideTextPagination(true);
        } else {
          setIsHideTextPagination(false);
        }
      }
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const changeIsOpenImport = isOpenDropdown => {
    if (isBoolean(isOpenDropdown)) {
      setIsOpenDropdownImport(isOpenDropdown);
    }
  };

  const changeIsOpen = isOpenDropdown => {
    if (isBoolean(isOpenDropdown)) {
      setIsOpenDropdownExport(isOpenDropdown);
    }
  };

  return (
    <>
      <div
        className={classNames('ecos-journal__settings-bar ecos-journal__settings-bar_new', {
          'ecos-journal__settings-bar_mobile': isMobile
        })}
        ref={journalSettingsBarRef}
      >
        {!noCreateMenu && <CreateMenu createIsLoading={isCreateLoading} createVariants={createVariants} onAddRecord={onAddRecord} />}

        {!isMobile && (
          <Tooltip target={`${targetId}-table-settings`} text={t(nameBtnSettings || Labels.BTN_TABLE_SETTINGS)} {...tooltipSettings}>
            <IcoBtn
              id={`${targetId}-table-settings`}
              icon={null}
              className={classNames(
                'ecos-btn_i ecos-btn_white ecos-btn_hover_blue2 ecos-btn_size-by-content ecos-journal__btn_new filter',
                {
                  'ecos-btn-settings-filter-on': !isDefaultSettings
                }
              )}
              onClick={onToggleSettings}
              // loading={isLoading}
            >
              <Setting />
            </IcoBtn>
          </Tooltip>
        )}

        {!hideSettingsJournalBtn && hasWritePermission && !isMobile && hasBtnEdit && (
          <Tooltip
            target={`${targetId}-journal-settings`}
            text={t(isKanban(viewMode) ? Labels.BTN_KANBAN_SETTINGS : Labels.BTN_JOURNAL_SETTINGS)}
            {...tooltipSettings}
          >
            <IcoBtn
              id={`${targetId}-journal-settings`}
              icon={null}
              className="journals-head__settings-btn ecos-btn_grey ecos-btn_bgr-inherit ecos-btn_width_auto ecos-btn_hover_t-light-blue ecos-journal__btn_new shape"
              onClick={onEditJournal}
              // loading={isLoading}
            >
              <Shape />
            </IcoBtn>
          </Tooltip>
        )}

        {isPreviewList(viewMode) && hasWritePermission && !isMobile && hasBtnEdit && showWidgets && (
          <Tooltip target={`${targetId}-widget-settings`} text={t(Labels.BTN_WIDGET_SETTINGS)} {...tooltipSettings}>
            <IcoBtn
              id={`${targetId}-widget-settings`}
              icon={null}
              className="journals-head__settings-btn ecos-btn_grey ecos-btn_bgr-inherit ecos-btn_width_auto ecos-btn_hover_t-light-blue ecos-journal__btn_new shape"
              onClick={() => WidgetService.openEditJournalWidgets()}
            >
              <Shape />
            </IcoBtn>
          </Tooltip>
        )}

        {headerSearchEnabled && (
          <Search
            onSearch={onSearch}
            className="ecos-journal__settings-bar-search search_border-white ecos-journal__btn_new search"
            collapsed={isMobile}
            text={searchText}
            cleaner
          />
        )}

        <OverflowMenu isCollapsed={isCollapsed}>
          {!noGroupActions && !hideActionsBtn && <GroupActions stateId={stateId} />}

          {leftChild}

          {!hidePresetsBtn && !isMobile && (
            <JournalsPresetListDropdown
              toggleClassName={classNames({ 'full-width': isCollapsed })}
              className={classNames({ 'full-width': isCollapsed })}
              stateId={stateId}
            />
          )}

          <div className={classNames('ecos-journal__settings-bar-actions', { 'full-width': isCollapsed })}>
            {!hideExportBtn && !isMobile && (
              <Tooltip target={`${targetId}-export`} text={t(Labels.BTN_EXPORT)} {...tooltipSettings}>
                <Export
                  id={`${targetId}-export`}
                  journalConfig={journalConfig}
                  journalSetting={journalSetting}
                  grid={grid}
                  className={classNames('ecos-journal__settings-bar-export', { 'full-width': isCollapsed })}
                  classNameBtn={classNames('ecos-btn_i ecos-journal__settings-bar-export-btn ecos-journal__btn_new', {
                    'full-width': isCollapsed
                  })}
                  selectedItems={selectedRecords}
                  getStateOpen={changeIsOpen}
                >
                  <IcoBtn
                    invert
                    icon="icon-small-down"
                    className={classNames(
                      'ecos-journal__settings-bar-export-btn ecos-btn_hover_blue2 ecos-btn_drop-down ecos-btn_grey3 ecos-journal__btn_new export',
                      {
                        'ecos-journal__btn_new_focus': isOpenDropdownExport,
                        'full-width': isCollapsed
                      }
                    )}
                    // loading={isLoading}
                  >
                    <ExportIcon />
                  </IcoBtn>
                </Export>
              </Tooltip>
            )}

            {!hideImportBtn && get(journalConfig, 'typeRef') && (
              <Tooltip target={`${targetId}-import`} text={t(Labels.BTN_IMPORT)} {...tooltipSettings}>
                <Import
                  id={`${targetId}-import`}
                  stateId={stateId}
                  getStateOpen={changeIsOpenImport}
                  className={classNames('ecos-journal__settings-bar-export', { 'full-width': isCollapsed })}
                  classNameBtn={classNames('ecos-btn_i ecos-journal__settings-bar-export-btn ecos-journal__btn_new', {
                    'full-width': isCollapsed
                  })}
                >
                  <IcoBtn
                    invert
                    icon="icon-small-down"
                    className={classNames(
                      'ecos-journal__settings-bar-export-btn ecos-btn_hover_blue2 ecos-btn_drop-down ecos-btn_grey3 ecos-journal__btn_new export',
                      {
                        'ecos-journal__btn_new_focus': isOpenDropdownImport,
                        'full-width': isCollapsed
                      }
                    )}
                    // loading={isLoading}
                  >
                    <ImportIcon />
                  </IcoBtn>
                </Import>
              </Tooltip>
            )}
          </div>
        </OverflowMenu>

        <Tooltip target={`${targetId}-update`} text={t(Labels.BTN_UPDATE)} {...tooltipSettings}>
          <IcoBtn
            id={`${targetId}-update`}
            icon={null}
            className={classNames('ecos-journal__settings-bar-update ecos-journal__small-btn_new', {
              [grey]: !isMobile,
              'ecos-btn_i ecos-btn_white': isMobile
            })}
            loading={isRefreshing}
            disabled={isRefreshing}
            onClick={onRefresh}
          >
            <Repeat />
          </IcoBtn>
        </Tooltip>

        {isShowResetFilter && !isLoading && (
          <Tooltip target={`${targetId}-reset-filter`} text={t(Labels.BTN_FILTER_DEL)} {...tooltipSettings}>
            <IcoBtn
              id={`${targetId}-reset-filter`}
              icon={null}
              className={classNames('ecos-journal__settings-bar-reset-filter ecos-journal__small-btn_new', {
                [grey]: !isMobile,
                'ecos-btn_i ecos-btn_white': isMobile
              })}
              onClick={onResetFilter}
            >
              <Filter />
            </IcoBtn>
          </Tooltip>
        )}

        <div
          className={classNames('ecos-journal__settings-bar-container', {
            'ecos-journal__settings-bar-container_mobile': isMobile,
            'ecos-journal__hide-text-pagination': isHideTextPagination
          })}
        >
          <div className="ecos-journal__settings-bar-right-side">
            {isKanban(viewMode) && rightChild}
            <ViewTabs stateId={stateId} />
            {!isKanban(viewMode) && rightChild}
          </div>
          {rightBarChild}

          {hasBtnMenu && isMobile && (
            <IcoBtn className="ecos-journal__settings-bar-menu_mobile" onClick={onToggleMenu}>
              <Menu />
            </IcoBtn>
          )}
        </div>
      </div>

      <div className={classNames('ecos-journal__settings-bar-extra', { 'ecos-journal__settings-bar-extra_mobile': isMobile })} />
    </>
  );
};

export default JournalsSettingsBar;
