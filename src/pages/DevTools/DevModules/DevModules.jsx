import React, { useContext } from 'react';

import { DevToolsContext } from '../DevToolsContext';

const DevModulesTab = () => {
  const context = useContext(DevToolsContext);
  const { activeTab } = context;

  return <>2. Active tab: {activeTab}</>;
};

export default DevModulesTab;
