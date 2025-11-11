import classNames from 'classnames';
import get from 'lodash/get';
import isBoolean from 'lodash/isBoolean';
import isEmpty from 'lodash/isEmpty';
import React, { useMemo, useState } from 'react';

import Export from '../../Export/Export';
import { ParserPredicate } from '../../Filters/predicates';
import Import from '../../Import';
import { Search, Tooltip } from '../../common';
import { IcoBtn } from '../../common/btns';
import ExportIcon from '../../common/icons/Export';
import Filter from '../../common/icons/Filter';
import ImportIcon from '../../common/icons/Import';
import Menu from '../../common/icons/Menu';
import Repeat from '../../common/icons/Repeat';
import Setting from '../../common/icons/Setting';
import Shape from '../../common/icons/Shape';
import GroupActions from '../GroupActions';
import { JournalsPresetListDropdown } from '../JournalsPresets';
import ViewTabs from '../ViewTabs';
import { isKanban, isPreviewList } from '../constants';

import CreateMenu from './CreateMenu';

import { JournalUrlParams as JUP } from '@/constants/index';
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

  isViewNewJournal,
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
        className={classNames('ecos-journal__settings-bar', {
          'ecos-journal__settings-bar_mobile': isMobile,
          'ecos-journal__settings-bar_new': isViewNewJournal
        })}
      >
        {!noCreateMenu && (
          <CreateMenu
            isViewNewJournal={isViewNewJournal}
            createIsLoading={isCreateLoading}
            createVariants={createVariants}
            onAddRecord={onAddRecord}
          />
        )}

        {!isMobile && (
          <Tooltip target={`${targetId}-table-settings`} text={t(nameBtnSettings || Labels.BTN_TABLE_SETTINGS)} {...tooltipSettings}>
            <IcoBtn
              id={`${targetId}-table-settings`}
              icon={!isViewNewJournal ? 'icon-settings' : null}
              className={classNames('ecos-btn_i ecos-btn_white ecos-btn_hover_blue2 ecos-btn_size-by-content', {
                'ecos-btn-settings-filter-on': !isDefaultSettings,
                'ecos-journal__btn_new filter': isViewNewJournal
              })}
              onClick={onToggleSettings}
              // loading={isLoading}
            >
              {isViewNewJournal && <Setting />}
            </IcoBtn>
          </Tooltip>
        )}

        {!hideSettingsJournalBtn && hasWritePermission && isViewNewJournal && !isMobile && hasBtnEdit && (
          <Tooltip
            target={`${targetId}-journal-settings`}
            text={t(isKanban(viewMode) ? Labels.BTN_KANBAN_SETTINGS : Labels.BTN_JOURNAL_SETTINGS)}
            {...tooltipSettings}
          >
            <IcoBtn
              id={`${targetId}-journal-settings`}
              icon={!isViewNewJournal ? 'icon-settings' : null}
              className={classNames(
                'journals-head__settings-btn ecos-btn_grey ecos-btn_bgr-inherit ecos-btn_width_auto ecos-btn_hover_t-light-blue',
                {
                  'ecos-journal__btn_new shape': isViewNewJournal
                }
              )}
              onClick={onEditJournal}
              // loading={isLoading}
            >
              {isViewNewJournal && <Shape />}
            </IcoBtn>
          </Tooltip>
        )}

        {isPreviewList(viewMode) && hasWritePermission && isViewNewJournal && !isMobile && hasBtnEdit && showWidgets && (
          <Tooltip target={`${targetId}-journal-settings`} text={t(Labels.BTN_WIDGET_SETTINGS)} {...tooltipSettings}>
            <IcoBtn
              id={`${targetId}-journal-settings`}
              icon={!isViewNewJournal ? 'icon-settings' : null}
              className={classNames(
                'journals-head__settings-btn ecos-btn_grey ecos-btn_bgr-inherit ecos-btn_width_auto ecos-btn_hover_t-light-blue',
                {
                  'ecos-journal__btn_new shape': isViewNewJournal
                }
              )}
              onClick={() => WidgetService.openEditJournalWidgets()}
            >
              {isViewNewJournal && <Shape />}
            </IcoBtn>
          </Tooltip>
        )}

        {headerSearchEnabled && (
          <Search
            onSearch={onSearch}
            className={classNames('ecos-journal__settings-bar-search search_border-white', {
              'ecos-journal__btn_new search': isViewNewJournal
            })}
            collapsed={isMobile}
            text={searchText}
            cleaner
          />
        )}

        {(!isMobile || isViewNewJournal) && !noGroupActions && !hideActionsBtn && (
          <GroupActions isViewNewJournal={isViewNewJournal} stateId={stateId} />
        )}

        {isViewNewJournal && leftChild}

        {!hidePresetsBtn && isViewNewJournal && !isMobile && <JournalsPresetListDropdown stateId={stateId} />}

        {!hideExportBtn && !isViewNewJournal && (
          <Export
            journalConfig={journalConfig}
            journalSetting={journalSetting}
            grid={grid}
            className="ecos-journal__settings-bar-export"
            classNameBtn="ecos-btn_i ecos-journal__settings-bar-export-btn"
            selectedItems={selectedRecords}
          >
            {!isMobile && (
              <IcoBtn
                invert
                icon="icon-small-down"
                className="ecos-journal__settings-bar-export-btn ecos-btn_hover_blue2 ecos-btn_drop-down ecos-btn_grey3"
                // loading={isLoading}
              >
                {t(Labels.BTN_EXPORT)}
              </IcoBtn>
            )}
          </Export>
        )}

        {!hideExportBtn && isViewNewJournal && !isMobile && (
          <Export
            journalConfig={journalConfig}
            journalSetting={journalSetting}
            grid={grid}
            className="ecos-journal__settings-bar-export"
            classNameBtn="ecos-btn_i ecos-journal__settings-bar-export-btn ecos-journal__btn_new"
            selectedItems={selectedRecords}
            isViewNewJournal={isViewNewJournal}
            getStateOpen={changeIsOpen}
          >
            <IcoBtn
              invert
              icon="icon-small-down"
              className={classNames(
                'ecos-journal__settings-bar-export-btn ecos-btn_hover_blue2 ecos-btn_drop-down ecos-btn_grey3 ecos-journal__btn_new export',
                {
                  'ecos-journal__btn_new_focus': isOpenDropdownExport
                }
              )}
              // loading={isLoading}
            >
              <ExportIcon />
            </IcoBtn>
          </Export>
        )}

        {!hideImportBtn && get(journalConfig, 'typeRef') && (
          <Import
            stateId={stateId}
            isViewNewJournal={isViewNewJournal}
            getStateOpen={changeIsOpenImport}
            className="ecos-journal__settings-bar-export"
            classNameBtn={classNames('ecos-btn_i ecos-journal__settings-bar-export-btn', {
              'ecos-journal__btn_new': isViewNewJournal
            })}
          >
            <IcoBtn
              invert
              icon="icon-small-down"
              className={classNames('ecos-journal__settings-bar-export-btn ecos-btn_hover_blue2 ecos-btn_drop-down ecos-btn_grey3', {
                'ecos-journal__btn_new_focus': isOpenDropdownImport,
                'ecos-journal__btn_new export': isViewNewJournal
              })}
              // loading={isLoading}
            >
              {isViewNewJournal ? <ImportIcon /> : t(Labels.BTN_IMPORT)}
            </IcoBtn>
          </Import>
        )}

        <Tooltip target={`${targetId}-update`} text={t(Labels.BTN_UPDATE)} {...tooltipSettings} modifiers={[]}>
          <IcoBtn
            id={`${targetId}-update`}
            icon={!isViewNewJournal ? 'icon-reload' : null}
            className={classNames('ecos-journal__settings-bar-update', {
              [grey]: !isMobile,
              'ecos-btn_i ecos-btn_white': isMobile,
              'ecos-journal__small-btn_new': isViewNewJournal
            })}
            onClick={onRefresh}
          >
            {isViewNewJournal && <Repeat />}
          </IcoBtn>
        </Tooltip>

        {isShowResetFilter && (
          <Tooltip target={`${targetId}-reset-filter`} text={t(Labels.BTN_FILTER_DEL)} {...tooltipSettings}>
            <IcoBtn
              id={`${targetId}-reset-filter`}
              icon={!isViewNewJournal ? 'icon-filter-clean' : null}
              className={classNames('ecos-journal__settings-bar-reset-filter', {
                [grey]: !isMobile,
                'ecos-btn_i ecos-btn_white': isMobile,
                'ecos-journal__small-btn_new': isViewNewJournal
              })}
              onClick={onResetFilter}
            >
              {isViewNewJournal && <Filter />}
            </IcoBtn>
          </Tooltip>
        )}

        {!isViewNewJournal && leftChild}
        {!isViewNewJournal && (
          <div className="ecos-journal__settings-bar-right-side">
            {rightChild}
            <ViewTabs stateId={stateId} />
          </div>
        )}

        {isViewNewJournal && (
          <div
            className={classNames('ecos-journal__settings-bar-container', {
              'ecos-journal__settings-bar-container_mobile': isMobile
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
        )}
      </div>

      <div className={classNames('ecos-journal__settings-bar-extra', { 'ecos-journal__settings-bar-extra_mobile': isMobile })}>
        {isMobile && !isViewNewJournal && <GroupActions stateId={stateId} />}
      </div>
    </>
  );
};

export default JournalsSettingsBar;
