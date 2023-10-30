import React, { useContext } from 'react';

import { MigrationContext } from './MigrationContext';
import BpmnSchema from './BpmnSchema';
import InfoPanel from './InfoPanel';
import { MIGRATION_VERSION_BLOCK_CLASS } from './constants';
import MigrationInfo from './MigrationInfo';
import { t } from '../../helpers/util';

const BPMNVersionsMigrationDashboard = () => {
  const { instanceId, dispInstanceId } = useContext(MigrationContext);

  return (
    <div className={MIGRATION_VERSION_BLOCK_CLASS}>
      <h5 className={`${MIGRATION_VERSION_BLOCK_CLASS}__title`}>{t('version-migration.title', { instanceId: dispInstanceId })}</h5>
      <InfoPanel instanceId={instanceId} />
      <BpmnSchema instanceId={instanceId} />
      <MigrationInfo instanceId={instanceId} />
    </div>
  );
};

export default BPMNVersionsMigrationDashboard;
