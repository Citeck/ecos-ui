import React from 'react';
import classNames from 'classnames';

import { Caption } from '../../common/form';
import { IcoBtn } from '../../common/btns';
import TitlePageLoader from '../../common/TitlePageLoader';

import './JournalsHead.scss';

const JournalsHead = ({ menuOpen, toggleMenu, title, isMobile, hasBtnMenu, showLabel }) => {
  return (
    <div className="journals-head">
      <TitlePageLoader isReady={!!title}>
        <Caption normal className={classNames('journals-head__caption', { 'journals-head__caption_small': isMobile })}>
          {title}
        </Caption>
      </TitlePageLoader>
      {hasBtnMenu && (
        <div className={classNames('journals-head__menu-btn', { 'journals-head__menu-btn_hidden': menuOpen })}>
          <IcoBtn
            onClick={toggleMenu}
            icon={'icon-small-arrow-left'}
            className={'ecos-btn_light-blue ecos-btn_hover_dark-blue ecos-btn_narrow-t_standard ecos-btn_r_biggest'}
          >
            {showLabel}
          </IcoBtn>
        </div>
      )}
    </div>
  );
};

export default JournalsHead;
