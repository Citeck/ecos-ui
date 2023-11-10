import React, { useContext } from 'react';

import { MigrationContext } from './MigrationContext';
import BpmnSchema from './BpmnSchema';
import MigrationInfo from './MigrationInfo';
import { MIGRATION_VERSION_BLOCK_CLASS } from './constants';
import { t } from '../../helpers/util';

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
