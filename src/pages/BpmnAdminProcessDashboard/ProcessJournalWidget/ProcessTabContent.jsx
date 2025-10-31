import React, { useContext } from 'react';

import { ProcessContext } from '../ProcessContext';
import { VersionTable } from './VersionTable';

const ProcessTabContent = () => {
  const { activeTabId, processId } = useContext(ProcessContext);

  return <VersionTable processId={processId} tabId={activeTabId} />;
};

export default ProcessTabContent;
