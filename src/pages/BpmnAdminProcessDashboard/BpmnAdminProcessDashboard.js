import React, { useContext } from 'react';

import { t } from '../../helpers/util';
import InfoPanel from './InfoPanel';
import ProcessBpmn from './ProcessBpmn';
import { ProcessContext } from './ProcessContext';
import ProcessJournalWidget from './ProcessJournalWidget';

import './style.scss';

const BpmnAdminProcessDashboard = () => {
  const { activityElement, processId, processKey } = useContext(ProcessContext);

  return (
    <div className="bpmn-admin-process-page">
      <h5 className="bpmn-admin-process-page__title">{t('bpmn-admin.process-administration', { processKey })}</h5>
      <InfoPanel processId={processId} />
      <ProcessBpmn activityElement={activityElement} processId={processId} />
      <ProcessJournalWidget processId={processId} />
    </div>
  );
};

export default BpmnAdminProcessDashboard;
