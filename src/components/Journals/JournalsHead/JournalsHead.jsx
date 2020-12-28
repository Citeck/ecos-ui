import React from 'react';
import ReactPlaceholder from 'react-placeholder';
import RectShape from 'react-placeholder/lib/placeholders/RectShape';
import classNames from 'classnames';

import { t } from '../../../helpers/util';
import { Caption } from '../../common/form';
import { IcoBtn } from '../../common/btns';

import './JournalsHead.scss';

const JournalsHead = ({ menuOpen, toggleMenu, title, isMobile, hasBtnMenu }) => {
  return (
    <div className="journals-head">
      <ReactPlaceholder
        type="textRow"
        ready={!!title}
        showLoadingAnimation={true}
        customPlaceholder={<RectShape color="#b7b7b7" style={{ width: 200, height: 20 }} />}
      >
        <Caption normal className={classNames('journals-head__caption', { 'journals-head__caption_small': isMobile })}>
          {title}
        </Caption>
      </ReactPlaceholder>
      {hasBtnMenu && (
        <div className={classNames('journals-head__menu-btn', { 'journals-head__menu-btn_hidden': menuOpen })}>
          <IcoBtn
            onClick={toggleMenu}
            icon={'icon-small-arrow-left'}
            className={'ecos-btn_light-blue ecos-btn_hover_dark-blue ecos-btn_narrow-t_standart ecos-btn_r_biggest'}
          >
            {isMobile ? t('journals.action.show-menu_sm') : t('journals.action.show-menu')}
          </IcoBtn>
        </div>
      )}
    </div>
  );
};

export default JournalsHead;
