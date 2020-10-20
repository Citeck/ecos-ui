import React, { useContext } from 'react';

import { DevToolsContext } from '../DevToolsContext';

const CommitsTab = () => {
  const context = useContext(DevToolsContext);
  const { activeTab } = context;

  return <>3. Active tab: {activeTab}</>;
};

export default CommitsTab;
