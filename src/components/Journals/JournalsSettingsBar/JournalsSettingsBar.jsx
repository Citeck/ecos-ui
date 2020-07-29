import React from 'react';
import classNames from 'classnames';
import get from 'lodash/get';

import { t } from '../../../helpers/util';
import { Search } from '../../common';
import { IcoBtn, TwoIcoBtn } from '../../common/btns';
import { Dropdown } from '../../common/form';
import Export from '../../Export/Export';
import JournalsDashletPagination from '../JournalsDashletPagination';

import './JournalsSettingsBar.scss';

const JournalsSettingsBar = ({
  stateId,
  showPreview,
  showPie,
  toggleSettings,
  togglePreview,
  showGrid,
  refresh,
  onSearch,
  journalConfig,
  addRecord,
  grid,
  isMobile,
  searchText
}) => {
  const blue = 'ecos-btn_i ecos-btn_blue2 ecos-btn_bgr-inherit ecos-btn_width_auto ecos-btn_hover_t-light-blue';
  const grey = 'ecos-btn_i ecos-btn_grey ecos-btn_bgr-inherit ecos-btn_width_auto ecos-btn_hover_t-light-blue';
  const step = classNames('ecos-journal__settings-bar_step', { 'ecos-journal__settings-bar_step-mobile': isMobile });

  const renderCreateMenu = () => {
    const createVariants = get(journalConfig, 'meta.createVariants') || [];

    if (isMobile || !createVariants.length) {
      return null;
    }

    if (createVariants.length === 1) {
      return (
        <IcoBtn
          icon={'icon-small-plus'}
          className={`ecos-journal__add-record ecos-btn_i ecos-btn_white ecos-btn_hover_blue2 ${step}`}
          onClick={() => addRecord(createVariants[0])}
        />
      );
    }

    return (
      <Dropdown hasEmpty isButton source={createVariants} valueField="destination" titleField="title" onChange={addRecord} className={step}>
        <TwoIcoBtn
          icons={['icon-small-plus', 'icon-small-down']}
          className="ecos-journal__add-record ecos-btn_settings-down ecos-btn_white ecos-btn_hover_blue2"
          title={t('journals.create-record-btn')}
        />
      </Dropdown>
    );
  };

  return (
    <div className={classNames('ecos-journal__settings-bar', { 'ecos-journal__settings-bar_mobile': isMobile })}>
      {renderCreateMenu()}

      {!isMobile && (
        <IcoBtn
          title={t('journals.settings')}
          icon={'icon-settings'}
          className={`ecos-btn_i ecos-btn_white ecos-btn_hover_blue2 ${step}`}
          onClick={toggleSettings}
        />
      )}

      <Search
        onSearch={onSearch}
        className={`ecos-journal__settings-bar-search search_border-white ${step}`}
        collapsed={isMobile}
        text={searchText}
        cleaner
      />

      <Export journalConfig={journalConfig} grid={grid} className={classNames('ecos-journal__settings-bar-export', step)}>
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
              icon={'icon-list'}
              className={`${!showPie && !showPreview ? blue : grey} ${step} ecos-journal__settings-bar_right-btn`}
              onClick={showGrid}
            />
            <IcoBtn
              title={t('doc-preview.preview')}
              icon={'icon-columns'}
              className={`${showPreview ? blue : grey} ${step} ecos-journal__settings-bar_right-btn`}
              onClick={togglePreview}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default JournalsSettingsBar;
