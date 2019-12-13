import React from 'react';
import classNames from 'classnames';
import get from 'lodash/get';

import { t } from '../../../helpers/util';
import { IcoBtn } from '../../common/btns';
import Search from '../../common/Search/Search';
import Export from '../../Export/Export';
import JournalsDashletPagination from '../JournalsDashletPagination';

import './JournalsSettingsBar.scss';

const JournalsSettingsBar = ({
  stateId,
  showPreview,
  showPie,
  toggleSettings,
  togglePreview,
  togglePie,
  showGrid,
  refresh,
  onSearch,
  journalConfig,
  addRecord,
  grid,
  isMobile
}) => {
  const blue = 'ecos-btn_i ecos-btn_blue2 ecos-btn_bgr-inherit ecos-btn_width_auto ecos-btn_hover_t-light-blue';
  const grey = 'ecos-btn_i ecos-btn_grey ecos-btn_bgr-inherit ecos-btn_width_auto ecos-btn_hover_t-light-blue';
  const step = classNames('ecos-journal__settings-bar_step', { 'ecos-journal__settings-bar_step-mobile': isMobile });
  const hasCreateVariants = !!get(journalConfig, 'meta.createVariants[0]', false);

  return (
    <div className={'ecos-journal__settings-bar'}>
      {!isMobile && hasCreateVariants && (
        <IcoBtn
          icon={'icon-plus'}
          className={`ecos-journal__add-record ecos-btn_i ecos-btn_white ecos-btn_hover_blue2 ${step}`}
          onClick={addRecord}
          title={t('journals.create-record-btn')}
        />
      )}

      {!isMobile && (
        <IcoBtn
          title={t('journals.settings')}
          icon={'icon-settings'}
          className={`ecos-btn_i ecos-btn_white ecos-btn_hover_blue2 ${step}`}
          onClick={toggleSettings}
        />
      )}

      <Search onSearch={onSearch} className={`search_border-white ${step}`} collapsed={isMobile} cleaner />

      <Export journalConfig={journalConfig} grid={grid} className={classNames('ecos-journal__settings-bar-download', step)}>
        <IcoBtn
          invert
          icon={isMobile ? 'icon-download' : 'icon-down'}
          className={classNames('ecos-btn_hover_blue2 ecos-btn_r_6 ecos-btn_line-height_normal', {
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
        onClick={refresh}
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
              icon={'icon-list-1'}
              className={`${!showPie && !showPreview ? blue : grey} ${step} ecos-journal__settings-bar_right-btn`}
              onClick={showGrid}
            />
            <IcoBtn
              title={t('doc-preview.preview')}
              icon={'icon-columns'}
              className={`${showPreview ? blue : grey} ${step} ecos-journal__settings-bar_right-btn`}
              onClick={togglePreview}
            />
            {/*<IcoBtn icon={'icon-pie'} className={showPie ? blue : grey} onClick={togglePie} />*/}
          </>
        )}
      </div>
    </div>
  );
};

export default JournalsSettingsBar;
