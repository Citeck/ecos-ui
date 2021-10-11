import React from 'react';
import classNames from 'classnames';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';

import { t } from '../../../helpers/util';
import { Search } from '../../common';
import { IcoBtn } from '../../common/btns';
import Export from '../../Export/Export';
import JournalsDashletPagination from '../JournalsDashletPagination';
import CreateMenu from './CreateMenu';
import GroupActions from '../GroupActions';

import './JournalsSettingsBar.scss';

const JournalsSettingsBar = ({
  stateId,
  grid,
  journalConfig,
  searchText,
  selectedRecords,

  isMobile,

  createIsLoading,
  showGrid,
  showPreview,
  togglePreview,

  onRefresh,
  onSearch,
  onToggleSettings,
  onAddRecord
}) => {
  const blue = 'ecos-btn_i ecos-btn_blue2 ecos-btn_bgr-inherit ecos-btn_width_auto ecos-btn_hover_t-light-blue';
  const grey = 'ecos-btn_i ecos-btn_grey ecos-btn_bgr-inherit ecos-btn_width_auto ecos-btn_hover_t-light-blue';
  const step = classNames('ecos-journal__settings-bar_step', { 'ecos-journal__settings-bar_step-mobile': isMobile });
  const createVariants = get(journalConfig, 'meta.createVariants') || [];
  const noCreateMenu = isMobile || isEmpty(createVariants);

  return (
    <div className={classNames('ecos-journal__settings-bar', { 'ecos-journal__settings-bar_mobile': isMobile })}>
      {noCreateMenu && (
        <CreateMenu className={step} createIsLoading={createIsLoading} createVariants={createVariants} onAddRecord={onAddRecord} />
      )}

      {!isMobile && (
        <IcoBtn
          title={t('journals.settings')}
          icon={'icon-settings'}
          className={classNames('ecos-btn_i ecos-btn_white ecos-btn_hover_blue2', step, 'ecos-btn_size-by-content')}
          onClick={onToggleSettings}
        />
      )}

      <Search
        onSearch={onSearch}
        className={`ecos-journal__settings-bar-search search_border-white ${step}`}
        collapsed={isMobile}
        text={searchText}
        cleaner
      />

      <GroupActions stateId={stateId} />

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
          {!isMobile && t('button.export')}
        </IcoBtn>
      </Export>

      <IcoBtn
        title={t('dashlet.update.title')}
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
              title={t('journal.title')}
              icon={'icon-list'}
              className={classNames('ecos-journal__settings-bar_right-btn', step, { [grey]: showPreview, [blue]: !showPreview })}
              onClick={showGrid}
            />
            <IcoBtn
              title={t('doc-preview.preview')}
              icon={'icon-columns'}
              className={classNames('ecos-journal__settings-bar_right-btn', step, { [grey]: !showPreview, [blue]: showPreview })}
              onClick={togglePreview}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default JournalsSettingsBar;
