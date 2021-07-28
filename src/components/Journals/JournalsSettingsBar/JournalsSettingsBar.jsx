import React from 'react';
import classNames from 'classnames';
import get from 'lodash/get';

import { t } from '../../../helpers/util';
import { Search } from '../../common';
import { IcoBtn } from '../../common/btns';
import { Dropdown } from '../../common/form';
import Export from '../../Export/Export';
import { getCreateVariantKeyField } from '../service/util';
import JournalsDashletPagination from '../JournalsDashletPagination';
import { isDocLib, isPreview, JOURNAL_VIEW_MODE } from '../constants';

import './JournalsSettingsBar.scss';

const Labels = {
  BTN_SETTINGS: 'journals.settings',
  BTN_EXPORT: 'button.export',
  BTN_UPDATE: 'dashlet.update.title',
  BTN_JOURNAL: 'journal.title',
  BTN_PREVIEW: 'doc-preview.preview',
  BTN_DOCLIB: 'document-library.title'
};

const JournalsSettingsBar = ({
  stateId,
  grid,
  journalConfig,
  searchText,
  selectedRecords,
  viewMode,

  isMobile,
  isDocLibEnabled,
  isCreateLoading,
  isLoading,

  onRefresh,
  onSearch,
  onToggleSettings,
  onToggleViewMode,
  onAddRecord
}) => {
  const blue = 'ecos-btn_i ecos-btn_blue2 ecos-btn_bgr-inherit ecos-btn_width_auto ecos-btn_hover_t-light-blue';
  const grey = 'ecos-btn_i ecos-btn_grey ecos-btn_bgr-inherit ecos-btn_width_auto ecos-btn_hover_t-light-blue';
  const step = classNames('ecos-journal__settings-bar_step', { 'ecos-journal__settings-bar_step-mobile': isMobile });
  const isDocLibViewMode = isDocLib(viewMode);
  const isPreviewViewMode = isPreview(viewMode);

  const renderCreateMenu = () => {
    const createVariants = get(journalConfig, 'meta.createVariants') || [];

    if (isMobile || !createVariants || !createVariants.length) {
      return null;
    }

    if (createVariants.length === 1) {
      return (
        <IcoBtn
          loading={isCreateLoading}
          colorLoader="light-blue"
          icon="icon-small-plus"
          className={`ecos-journal__add-record ecos-btn_i ecos-btn_white ecos-btn_hover_blue2 ${step}`}
          onClick={() => onAddRecord(createVariants[0])}
        />
      );
    }

    const keyFields = getCreateVariantKeyField(createVariants[0]);

    return (
      <Dropdown
        hasEmpty
        isStatic
        className={step}
        source={createVariants}
        keyFields={keyFields}
        valueField="destination"
        titleField="title"
        onChange={onAddRecord}
        controlIcon="icon-small-plus"
        controlClassName="ecos-journal__add-record ecos-btn_settings-down ecos-btn_white ecos-btn_hover_blue2"
      />
    );
  };

  return (
    <div className={classNames('ecos-journal__settings-bar', { 'ecos-journal__settings-bar_mobile': isMobile })}>
      {renderCreateMenu()}

      {!isMobile && (
        <IcoBtn
          title={t(Labels.BTN_SETTINGS)}
          icon={'icon-settings'}
          className={classNames('ecos-btn_i', 'ecos-btn_white', 'ecos-btn_hover_blue2', step, 'ecos-btn_size-by-content')}
          onClick={onToggleSettings}
          loading={isLoading}
        />
      )}

      <Search
        onSearch={onSearch}
        className={`ecos-journal__settings-bar-search search_border-white ${step}`}
        collapsed={isMobile}
        text={searchText}
        cleaner
      />

      <Export
        journalConfig={journalConfig}
        grid={grid}
        className={classNames('ecos-journal__settings-bar-export', step)}
        selectedItems={selectedRecords}
      >
        <IcoBtn
          invert
          icon={isMobile ? 'icon-download' : 'icon-small-down'}
          className={classNames('ecos-btn_hover_blue2 ecos-btn_r_6', {
            'ecos-btn_drop-down ecos-btn_grey3': !isMobile,
            'ecos-btn_i ecos-btn_white': isMobile
          })}
        >
          {!isMobile && t(Labels.BTN_EXPORT)}
        </IcoBtn>
      </Export>

      <IcoBtn
        title={t(Labels.BTN_UPDATE)}
        icon={'icon-reload'}
        className={classNames('ecos-journal__settings-bar-update', step, {
          [grey]: !isMobile,
          'ecos-btn_i ecos-btn_white': isMobile
        })}
        onClick={onRefresh}
      />

      <div className="ecos-journal__settings-bar_right">
        <JournalsDashletPagination
          stateId={stateId}
          className={classNames('ecos-journal__pagination', step, {
            'ecos-journal__pagination_mobile': isMobile
          })}
        />
        {!isMobile && (
          <>
            <IcoBtn
              title={t(Labels.BTN_JOURNAL)}
              icon={'icon-list'}
              className={classNames('ecos-journal__settings-bar_right-btn', step, {
                [blue]: !isPreviewViewMode && !isDocLibViewMode,
                [grey]: isPreviewViewMode || isDocLibViewMode
              })}
              onClick={() => onToggleViewMode(JOURNAL_VIEW_MODE.GRID)}
            />
            <IcoBtn
              title={t(Labels.BTN_PREVIEW)}
              icon={'icon-columns'}
              className={classNames('ecos-journal__settings-bar_right-btn', step, {
                [blue]: isPreviewViewMode && !isDocLibViewMode,
                [grey]: !isPreviewViewMode || isDocLibViewMode
              })}
              onClick={() => onToggleViewMode(JOURNAL_VIEW_MODE.PREVIEW)}
            />
          </>
        )}
        {isDocLibEnabled && (
          <IcoBtn
            title={t(Labels.BTN_DOCLIB)}
            icon={'icon-folder'}
            className={classNames('ecos-journal__settings-bar_right-btn', step, {
              [blue]: isDocLibViewMode,
              [grey]: !isDocLibViewMode
            })}
            onClick={() => onToggleViewMode(JOURNAL_VIEW_MODE.DOC_LIB)}
          />
        )}
      </div>
    </div>
  );
};

export default JournalsSettingsBar;
