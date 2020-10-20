import React, { useContext } from 'react';

import { DevToolsContext } from '../DevToolsContext';

const SettingsTab = () => {
  const context = useContext(DevToolsContext);
  const { activeTab } = context;

  return <>4. Active tab: {activeTab}</>;
};

export default SettingsTab;
