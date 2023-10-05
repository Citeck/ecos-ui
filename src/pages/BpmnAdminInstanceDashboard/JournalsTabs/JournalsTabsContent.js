import React, { useContext } from 'react';

import Journal from './Journal';
import { INSTANCE_TABS_TYPES } from '../../../constants/instanceAdmin';
import { t } from '../../../helpers/util';
import Labels from './Labels';
import { Tabs } from '../../../components/common';
import { JOURNALS_TABS_BLOCK_CLASS } from '../constants';
import { InstanceContext } from '../InstanceContext';

const JournalsTabsContent = ({ instanceId }) => {
  const { activeTabId, setActiveTabId } = useContext(InstanceContext);

  const tabs = [
    {
      id: INSTANCE_TABS_TYPES.VARIABLES,
      label: t(Labels.VARIABLES)
    },
    {
      id: INSTANCE_TABS_TYPES.INCIDENTS,
      label: t(Labels.INCIDENTS)
    },
    {
      id: INSTANCE_TABS_TYPES.CALLED_PROCESS,
      label: t(Labels.CALLED_PROCESS)
    },
    {
      id: INSTANCE_TABS_TYPES.JOB_DEFINITIONS,
      label: t(Labels.JOB_DEFINITIONS)
    },
    {
      id: INSTANCE_TABS_TYPES.EXTERNAL_TASKS,
      label: t(Labels.EXTERNAL_TASKS)
    }
  ].map(tab => ({
    ...tab,
    isActive: tab.id === activeTabId,
    onClick: () => setActiveTabId(tab.id)
  }));

  return (
    <div className={JOURNALS_TABS_BLOCK_CLASS}>
      <Tabs items={tabs} narrow />
      <Journal instanceId={instanceId} tabId={activeTabId} />
    </div>
  );
};

export default JournalsTabsContent;
