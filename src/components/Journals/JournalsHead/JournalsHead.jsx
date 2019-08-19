import React, { Fragment } from 'react';
import { Caption } from '../../common/form';
import { IcoBtn } from '../../common/btns';
import { t } from '../../../helpers/util';

import './JournalsHead.scss';

const JournalsHead = ({ menuOpen, toggleMenu, title }) => {
  return (
    <Fragment>
      <div className={'ecos-journal__visibility-menu-btn'}>
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

      <div className={'ecos-journal__caption'}>
        <Caption large className={'ecos-journal__caption_align_top'}>
          {title}
        </Caption>
      </div>
    </Fragment>
  );
};

export default JournalsHead;
