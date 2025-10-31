import React from 'react';

import { InstanceContextProvider } from './InstanceContext';
import BpmnAdminInstanceDashboard from './BpmnAdminInstanceDashboard';

export default () => {
  return (
    <InstanceContextProvider>
      <BpmnAdminInstanceDashboard />
    </InstanceContextProvider>
  );
};
