import React from 'react';
import { IcoBtn, TwoIcoBtn } from '../../common/btns';
import JournalsDashletPagination from '../JournalsDashletPagination';

import './JournalsSettingsBar.scss';

const JournalsSettingsBar = ({ showPreview, showPie, toggleSettings, togglePreview, togglePie, showGrid, refresh }) => {
  const blue = 'ecos-btn_i ecos-btn_blue2 ecos-btn_bgr-inherit ecos-btn_width_auto ecos-btn_hover_t-light-blue';
  const grey = 'ecos-btn_i ecos-btn_grey ecos-btn_bgr-inherit ecos-btn_width_auto ecos-btn_hover_t-light-blue';
  const step = 'ecos-btn_x-step_15';

  return (
    <div className={'ecos-journal__settings-bar'}>
      <TwoIcoBtn
        icons={['icon-settings', 'icon-down']}
        className={`ecos-btn_white ecos-btn_hover_t-blue ecos-btn_settings-down ${step}`}
        onClick={toggleSettings}
      />

      <IcoBtn icon={'icon-reload'} className={`${grey} ${step}`} onClick={refresh} />

      <div className={'ecos-journal__settings-bar_right '}>
        <JournalsDashletPagination />

        <IcoBtn icon={'icon-list'} className={`${!showPie && !showPreview ? blue : grey} ${step}`} onClick={showGrid} />

        <IcoBtn icon={'icon-columns'} className={`${showPreview ? blue : grey} ${step}`} onClick={togglePreview} />

        <IcoBtn icon={'icon-pie'} className={showPie ? blue : grey} onClick={togglePie} />
      </div>
    </div>
  );
};

export default JournalsSettingsBar;
