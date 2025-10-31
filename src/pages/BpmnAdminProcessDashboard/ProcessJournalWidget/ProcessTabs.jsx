import React, { useContext } from 'react';

import { t } from '../../../helpers/util';
import { Tabs } from '../../../components/common';
import { PROCESS_TABS_TYPES } from '../../../constants/processAdmin';
import { ProcessContext } from '../ProcessContext';

const ProcessTabs = () => {
  const { activeTabId, setActiveTabId } = useContext(ProcessContext);

  const items = [
    {
      id: PROCESS_TABS_TYPES.INSTANCES,
      label: t('bpmn-admin.process-tabs.process-instances')
    },
    {
      id: PROCESS_TABS_TYPES.INCIDENTS,
      label: t('bpmn-admin.process-tabs.process-incidents')
    },
    {
      id: PROCESS_TABS_TYPES.JOB_DEFINITIONS,
      label: t('bpmn-admin.process-tabs.job-definitions')
    }
  ].map(item => ({
    ...item,
    isActive: item.id === activeTabId,
    onClick: () => setActiveTabId(item.id)
  }));

  return <Tabs items={items} narrow />;
};

export default ProcessTabs;
