import React from 'react';

import BpmnAdminProcessDashboard from './BpmnAdminProcessDashboard';
import { ProcessContextProvider } from './ProcessContext';

const BpmnAdminProcess = () => (
  <ProcessContextProvider>
    <BpmnAdminProcessDashboard />
  </ProcessContextProvider>
);

export default BpmnAdminProcess;
