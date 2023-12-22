import React, { useContext, useState } from 'react';
import AceEditor from 'react-ace';

import get from 'lodash/get';
import head from 'lodash/head';

import 'ace-builds/src-noconflict/mode-json';

import { notifyFailure, notifySuccess } from '../../../components/Records/actions/util/actionUtils';
import { t } from '../../../helpers/util';
import { Btn } from '../../../components/common/btns';
import Records from '../../../components/Records';
import { EcosModal, SaveAndCancelButtons } from '../../../components/common';
import { MigrationContext } from '../MigrationContext';
import { MIGRATION_INFO_BLOCK_CLASS } from '../constants';
import Labels from './Labels';

const MigrationInfo = ({ processId }) => {
  const { activities, migrationPlan, setMigrationPlan, sourceProcessDefinitionId, targetProcessDefinitionId } = useContext(
    MigrationContext
  );

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = () => {
    const [, source] = get(sourceProcessDefinitionId, 'id', '').split('@');
    const [, target] = get(targetProcessDefinitionId, 'id', '').split('@');

    Records.query(
      {
        sourceId: 'eproc/bpmn-process-migration',
        query: {
          migrationPlanGeneration: {
            sourceProcessDefinitionId: source,
            targetProcessDefinitionId: target,
            updateEventTriggers: false
          }
        }
      },
      {
        migrationPlan: 'migrationPlan?json'
      }
    ).then(result => {
      const record = head(result.records);

      if (record) {
        let plan = record.migrationPlan;

        if (activities && activities.length) {
          plan = {
            ...plan,
            processInstanceQuery: {
              processDefinitionId: source,
              activityIdIn: activities
            },
            skipCustomListeners: true
          };
        }

        setMigrationPlan(plan);
      }
    });
  };

  const handleMigrate = () => {
    setIsLoading(true);

    const migrationRecord = Records.get('eproc/bpmn-process-migration@');
    const [, source] = get(sourceProcessDefinitionId, 'id', '').split('@');

    migrationRecord.att('action', 'MIGRATE');
    migrationRecord.att('async', true);
    migrationRecord.att('migrationExecution', {
      migrationPlan,
      processInstanceQuery: {
        processDefinitionId: source,
        activityIdIn: activities
      },
      skipCustomListeners: true
    });

    migrationRecord
      .save()
      .then(() => {
        notifySuccess();
        setIsConfirmModalOpen(false);
        setIsLoading(false);
      })
      .catch(e => {
        notifyFailure(e.message);
        setIsConfirmModalOpen(false);
        setIsLoading(false);
      });
  };

  const generateDisabled = !processId || !sourceProcessDefinitionId || !targetProcessDefinitionId;

  return (
    <div className={MIGRATION_INFO_BLOCK_CLASS}>
      <div className={`${MIGRATION_INFO_BLOCK_CLASS}__version-select`}>
        <Btn onClick={handleGenerate} disabled={generateDisabled}>
          {t(Labels.MIGRATION_GENERATE_PLAN)}
        </Btn>
      </div>
      {migrationPlan && (
        <AceEditor
          mode="json"
          value={JSON.stringify(migrationPlan, null, 2)}
          enableSnippets
          enableBasicAutocompletion
          enableLiveAutocompletion
          setOptions={{
            useWorker: false,
            enableBasicAutocompletion: true,
            enableLiveAutocompletion: true,
            showLineNumbers: true
          }}
          editorProps={{
            $blockScrolling: true
          }}
        />
      )}
      {migrationPlan && (
        <Btn className={`${MIGRATION_INFO_BLOCK_CLASS}__migrate-button ecos-btn_blue`} onClick={() => setIsConfirmModalOpen(true)}>
          {t(Labels.MIGRATION_MIGRATE_BUTTON)}
        </Btn>
      )}
      <EcosModal title={t(Labels.CONFIRM_TITLE)} isOpen={isConfirmModalOpen} hideModal={() => isConfirmModalOpen(false)}>
        <div className={`${MIGRATION_INFO_BLOCK_CLASS}__confirm`}>
          <span>{t(Labels.CONFIRM_INFO)}</span>
          <span>{t(Labels.CONFIRM_QUESTION)}</span>
          <SaveAndCancelButtons
            handleCancel={() => setIsConfirmModalOpen(false)}
            handleSave={handleMigrate}
            saveText={t(Labels.START_BUTTON)}
            disabledSave={isLoading}
            loading={isLoading}
          />
        </div>
      </EcosModal>
    </div>
  );
};

export default MigrationInfo;
