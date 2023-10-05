import React from 'react';

import { t } from '../../helpers/util';
import { Caption } from '../../components/common/form';
import { TITLE } from '../../constants/pageTabs';
import ProcessesTable from './ProcessesTable';

import './style.scss';

const BpmAdministration = () => {
  return (
    <div className="bpmn-admin-page">
      <Caption normal>{t(TITLE.BPM_ADMIN)}</Caption>
      <ProcessesTable />
    </div>
  );
};

export default BpmAdministration;
