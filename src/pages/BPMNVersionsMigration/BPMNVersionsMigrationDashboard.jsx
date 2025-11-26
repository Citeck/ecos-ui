import React, { useContext } from 'react';

import { t } from '../../helpers/util';

import BpmnSchema from './BpmnSchema';
import { MigrationContext } from './MigrationContext';
import MigrationInfo from './MigrationInfo';
import { MIGRATION_VERSION_BLOCK_CLASS } from './constants';

const BPMNVersionsMigrationDashboard = () => {
  const { processId } = useContext(MigrationContext);

  return (
    <div className={MIGRATION_VERSION_BLOCK_CLASS}>
      <h5 className={`${MIGRATION_VERSION_BLOCK_CLASS}__title`}>{t('version-migration.title')}</h5>
      <BpmnSchema processId={processId} />
      <MigrationInfo processId={processId} />
    </div>
  );
};

export default BPMNVersionsMigrationDashboard;
