import React from 'react';
import { Caption } from '../../common/form';
import { IcoBtn } from '../../common/btns';
import { t } from '../../../helpers/util';

import './JournalsHead.scss';

const JournalsHead = ({ menuOpen, toggleMenu, title, pageTabsIsShow }) => {
  return (
    <div className={`journals-head ${pageTabsIsShow ? 'journals-head_with-tabs' : ''}`}>
      <Caption normal className={'journals-head__caption'}>
        {title}
      </Caption>

      <div className={`journals-head__menu-btn`}>
        {menuOpen ? null : (
          <IcoBtn
            onClick={toggleMenu}
            icon={'icon-arrow-left'}
            className={'ecos-btn_light-blue ecos-btn_hover_dark-blue ecos-btn_narrow-t_standart ecos-btn_r_biggest'}
          >
            {t('journals.action.show-menu')}
          </IcoBtn>
        )}
      </div>
    </div>
  );
};

export default JournalsHead;
