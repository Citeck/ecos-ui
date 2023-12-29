import React from 'react';
import MigrationModal from '../../../../../../pages/BpmnAdminInstanceDashboard/MigrationModal';
import Modal from '../../../../../common/EcosModal/CiteckEcosModal';
import ActionsExecutor from '../../ActionsExecutor';
import { t } from '../../../../../../helpers/util';
import { getStore } from '../../../../../../store';

export default class MigrateTokenAction extends ActionsExecutor {
  static ACTION_ID = 'migration';

  async execForRecord(record, action, context) {
    const modal = new Modal();
    const store = getStore();

    modal.open(<MigrationModal instanceId={record.id} store={store} />, {
      title: t('migration-modal.title'),
      class: 'ecos-modal_width-full'
    });
  }
}
