import React from 'react';

import ColumnsSetup from '../../ColumnsSetup/ColumnsSetup';
import PanelBar from '../../common/PanelBar/PanelBar';
import { t } from '../../../helpers/util';

import './JournalsColumnsSetup.scss';

const JournalsColumnsSetup = props => {
  const { columns, sortBy, onChange } = props;

  return (
    <PanelBar
      header={t('journals.columns-setup.header')}
      className="ecos-journals-columns-setup__panel-bar fitnesse-ecos-journals-columns-setup__panel-bar"
      css={{ headerClassName: 'panel-bar__header_upper' }}
      open={false}
    >
      <ColumnsSetup
        classNameToolbar={'ecos-journals-columns-setup__toolbar'}
        valueField={'attribute'}
        titleField={'text'}
        columns={columns}
        sortBy={sortBy}
        onChange={onChange}
      />
    </PanelBar>
  );
};

export default JournalsColumnsSetup;
