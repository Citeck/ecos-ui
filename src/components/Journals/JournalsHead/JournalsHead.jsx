import React from 'react';
import classNames from 'classnames';

import { extractLabel } from '../../../helpers/util';
import { Caption } from '../../common/form';
import { IcoBtn } from '../../common/btns';
import TitlePageLoader from '../../common/TitlePageLoader';

import './JournalsHead.scss';

const JournalsHead = ({ isOpenMenu, title, isMobile, hasBtnMenu, hasBtnEdit, labelBtnMenu, onToggleMenu, onEditJournal, onClick }) => {
  return (
    <div className="journals-head" onClick={onClick}>
      <TitlePageLoader isReady={!!title}>
        <Caption normal className={classNames('journals-head__caption', { 'journals-head__caption_small': isMobile })}>
          {extractLabel(title)}
        </Caption>
      </TitlePageLoader>
      {!isMobile && hasBtnEdit && (
        <IcoBtn
          icon="icon-settings"
          className="journals-head__settings-btn ecos-btn_grey ecos-btn_bgr-inherit ecos-btn_width_auto ecos-btn_hover_t-light-blue"
          onClick={onEditJournal}
        />
      )}
      <div className="journals-head__space" />
      {hasBtnMenu && (
        <div className={classNames('journals-head__menu-btn', { 'journals-head__menu-btn_hidden': isOpenMenu })}>
          <IcoBtn
            onClick={onToggleMenu}
            icon="icon-small-arrow-left"
            className={'ecos-btn_light-blue ecos-btn_hover_dark-blue ecos-btn_narrow-t_standard ecos-btn_r_biggest'}
          >
            {labelBtnMenu}
          </IcoBtn>
        </div>
      )}
    </div>
  );
};

export default JournalsHead;
