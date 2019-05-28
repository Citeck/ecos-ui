import React from 'react';
import { Well } from '../../common/form';
import { IcoBtn } from '../../common/btns';
import Search from '../../common/Search/Search';
import Export from '../../Export/Export';
import { t } from '../../../helpers/util';

import './JournalsTools.scss';

const JournalsTools = ({ journalConfig, addRecord }) => {
  return (
    <div className={'ecos-journal__tools'}>
      <Well className={'ecos-well_full ecos-journal__tools-well'}>
        <IcoBtn icon={'icon-plus'} className={'ecos-btn_blue ecos-btn_tight ecos-journal__tools-well_step'} onClick={addRecord}>
          {t('button.send')}
        </IcoBtn>

        <Search />

        <Export config={journalConfig} className={'ecos-journal_right'}>
          <IcoBtn icon={'icon-down'} className={'ecos-btn_drop-down ecos-btn_r_6'}>
            {t('button.export')}
          </IcoBtn>
        </Export>
      </Well>
    </div>
  );
};

export default JournalsTools;
