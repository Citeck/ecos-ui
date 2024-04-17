import React, { useContext } from 'react';

import { t } from '../../helpers/util';
import InfoPanel from './InfoPanel';
import { ProcessContext } from './ProcessContext';
import ProcessJournalWidget from './ProcessJournalWidget';
import { selectProcessMetaInfo } from '../../selectors/processAdmin';
import labels from './Labels';

import './style.scss';

const BpmnSchema = React.lazy(() => import('../../components/BpmnSchema'));

const BpmnAdminProcessDashboard = () => {
  const { activityElement, processId, processKey } = useContext(ProcessContext);

  const selectMetaInfo = (store, props) => {
    return selectProcessMetaInfo(store, { ...props, processId });
  };

  return (
    <div className="bpmn-admin-process-page">
      <h5 className="bpmn-admin-process-page__title">{t('bpmn-admin.process-administration', { processKey })}</h5>

      <InfoPanel processId={processId} />

      <BpmnSchema labels={labels} selectMetaInfo={selectMetaInfo} activityElement={activityElement} />

      <ProcessJournalWidget processId={processId} />
    </div>
  );
};

export default BpmnAdminProcessDashboard;
