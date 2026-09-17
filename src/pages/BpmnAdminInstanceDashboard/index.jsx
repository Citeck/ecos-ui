import React from 'react';

import { InstanceContextProvider } from './InstanceContext';
import BpmnAdminInstanceDashboard from './BpmnAdminInstanceDashboard';

export default ({ tabLink }) => {
  return (
    <InstanceContextProvider tabLink={tabLink}>
      <BpmnAdminInstanceDashboard />
    </InstanceContextProvider>
  );
};
