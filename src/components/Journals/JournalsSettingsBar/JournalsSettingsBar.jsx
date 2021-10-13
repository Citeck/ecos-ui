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
  const createVariants = get(journalConfig, 'meta.createVariants') || [];
  const noCreateMenu = isMobile || isEmpty(createVariants);

  return (
    <>
      <div className={classNames('ecos-journal__settings-bar', { 'ecos-journal__settings-bar_mobile': isMobile })}>
        {noCreateMenu && <CreateMenu createIsLoading={createIsLoading} createVariants={createVariants} onAddRecord={onAddRecord} />}

        {!isMobile && (
          <IcoBtn
            title={t('journals.settings')}
            icon={'icon-settings'}
            className="ecos-btn_i ecos-btn_white ecos-btn_hover_blue2 ecos-btn_size-by-content"
            onClick={onToggleSettings}
          />
        )}

        <Search
          onSearch={onSearch}
          className="ecos-journal__settings-bar-search search_border-white"
          collapsed={isMobile}
          text={searchText}
          cleaner
        />

        {!isMobile && <GroupActions stateId={stateId} />}

        <Export journalConfig={journalConfig} grid={grid} className="ecos-journal__settings-bar-export" selectedItems={selectedRecords}>
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
          className={classNames('ecos-journal__settings-bar-update', {
            [grey]: !isMobile,
            'ecos-btn_i ecos-btn_white': isMobile
          })}
          onClick={onRefresh}
        />

        <div className="ecos-journal__settings-bar-right-side">
          <JournalsDashletPagination
            stateId={stateId}
            className={classNames('ecos-journal__pagination', {
              'ecos-journal__pagination_mobile': isMobile
            })}
          />
          {!isMobile && (
            <>
              <IcoBtn
                title={t('journal.title')}
                icon={'icon-list'}
                className={classNames({ [grey]: showPreview, [blue]: !showPreview })}
                onClick={showGrid}
              />
              <IcoBtn
                title={t('doc-preview.preview')}
                icon={'icon-columns'}
                className={classNames({ [grey]: !showPreview, [blue]: showPreview })}
                onClick={togglePreview}
              />
            </>
          )}
        </div>
      </div>
      <div className={classNames('ecos-journal__settings-bar-extra', { 'ecos-journal__settings-bar-extra_mobile': isMobile })}>
        {isMobile && <GroupActions stateId={stateId} />}
      </div>
    </>
  );
};

export default JournalsSettingsBar;
