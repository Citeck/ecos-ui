import React from 'react';
import { IcoBtn } from '../../common/btns';
import Search from '../../common/Search/Search';
import Export from '../../Export/Export';
import JournalsDashletPagination from '../JournalsDashletPagination';
import { t } from '../../../helpers/util';

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
  grid
}) => {
  const blue = 'ecos-btn_i ecos-btn_blue2 ecos-btn_bgr-inherit ecos-btn_width_auto ecos-btn_hover_t-light-blue';
  const grey = 'ecos-btn_i ecos-btn_grey ecos-btn_bgr-inherit ecos-btn_width_auto ecos-btn_hover_t-light-blue';
  const step = 'ecos-journal__settings-bar_step';

  return (
    <div className={'ecos-journal__settings-bar'}>
      {journalConfig && journalConfig.meta && Array.isArray(journalConfig.meta.createVariants) && journalConfig.meta.createVariants[0] ? (
        <IcoBtn
          icon={'icon-plus'}
          className={`ecos-journal__add-record ecos-btn_i ecos-btn_white ecos-btn_hover_blue2 ${step}`}
          onClick={addRecord}
          title={t('journals.create-record-btn')}
        />
      ) : null}

      <IcoBtn
        title={t('journals.settings')}
        icon={'icon-settings'}
        className={`ecos-btn_i ecos-btn_white ecos-btn_hover_blue2 ${step}`}
        onClick={toggleSettings}
      />

      <Search onSearch={onSearch} className={`search_border_white ${step}`} />

      <Export journalConfig={journalConfig} grid={grid}>
        <IcoBtn
          invert
          icon={'icon-down'}
          className={`ecos-btn_drop-down ecos-btn_grey3 ecos-btn_hover_blue2 ecos-btn_r_6 ecos-btn_line-height_normal ${step}`}
        >
          {t('button.export')}
        </IcoBtn>
      </Export>

      <IcoBtn title={t('dashlet.update.title')} icon={'icon-reload'} className={`${grey} ${step}`} onClick={refresh} />

      <div className={'ecos-journal__settings-bar_right '}>
        <JournalsDashletPagination stateId={stateId} className={step} />

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

        {/*<IcoBtn icon={'icon-pie'} className={showPie ? blue : grey} onClick={togglePie} />*/}
      </div>
    </div>
  );
};

export default JournalsSettingsBar;
