import React, { useContext } from 'react';

import { DevToolsContext } from '../DevToolsContext';

const BuildTab = () => {
  const context = useContext(DevToolsContext);
  const { activeTab } = context;

  return <>1. Active tab: {activeTab}</>;
};

export default BuildTab;
