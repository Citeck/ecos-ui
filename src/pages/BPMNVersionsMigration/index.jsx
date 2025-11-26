import React from 'react';

import BPMNVersionsMigrationDashboard from './BPMNVersionsMigrationDashboard';
import { MigrationContextProvider } from './MigrationContext';

import './style.scss';

const BPMNVersionsMigration = () => (
  <MigrationContextProvider>
    <BPMNVersionsMigrationDashboard />
  </MigrationContextProvider>
);

export default BPMNVersionsMigration;
