import React from 'react';
import { Well } from '../../common/form';
import { IcoBtn } from '../../common/btns';
import { Search } from '../../common';
import Export from '../../Export/Export';
import { t } from '../../../helpers/util';

import './JournalsTools.scss';

const JournalsTools = ({ journalConfig, addRecord, onSearch, selectedRecords }) => {
  return (
    <div className="ecos-journal__tools'">
      <Well className="ecos-well_full ecos-journal__tools-well">
        {journalConfig.meta.createVariants[0] ? (
          <IcoBtn icon={'icon-small-plus'} className="ecos-btn_blue ecos-btn_tight ecos-journal__tools-well_step" onClick={addRecord}>
            {t('journals.create-record-btn')}
          </IcoBtn>
        ) : null}

        <Search className="ecos-journal__tools-search" onSearch={onSearch} />

        <Export right config={journalConfig} className="ecos-journal__tools-export ecos-journal_right" selectedItems={selectedRecords}>
          <IcoBtn icon={'icon-small-down'} className="ecos-btn_drop-down ecos-btn_r_6">
            {t('button.export')}
          </IcoBtn>
        </Export>
      </Well>
    </div>
  );
};

export default JournalsTools;
