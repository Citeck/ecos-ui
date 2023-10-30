import React, { useContext, useEffect, useState } from 'react';
import { connect } from 'react-redux';
import AceEditor from 'react-ace';

import get from 'lodash/get';
import head from 'lodash/head';
import isFunction from 'lodash/isFunction';

import 'ace-builds/src-noconflict/mode-json';

import { selectInstanceMetaInfo } from '../../../selectors/instanceAdmin';
import { selectProcessMetaInfo, selectProcessVersions } from '../../../selectors/processAdmin';
import { getAllVersions, getMetaInfo } from '../../../actions/processAdmin';
import { notifyFailure, notifySuccess } from '../../../components/Records/actions/util/actionUtils';
import { Select } from '../../../components/common/form';
import { t } from '../../../helpers/util';
import { Btn } from '../../../components/common/btns';
import Records from '../../../components/Records';
import { EcosModal, Loader, SaveAndCancelButtons } from '../../../components/common';
import { MigrationContext } from '../MigrationContext';
import { MIGRATION_INFO_BLOCK_CLASS } from '../constants';
import Labels from './Labels';

const MigrationInfo = ({ processId, processInfo, versionsInfo, getAllVersions, getProcessInfo }) => {
  const { migrationPlan, setMigrationPlan, setSourceProcessDefinitionId } = useContext(MigrationContext);

  const [selectedVersion, setSelectedVersion] = useState(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(
    () => {
      isFunction(getProcessInfo) && getProcessInfo(processId);
    },
    [processId]
  );

  useEffect(
    () => {
      if (!processInfo) {
        return;
      }

      isFunction(getAllVersions) && getAllVersions(processId, processInfo.key);
    },
    [processInfo]
  );

  if (!processInfo || !versionsInfo || (versionsInfo && versionsInfo.loading)) {
    return <Loader />;
  }

  const getLabel = option => {
    const version = option.version ? option.version : `${option.innerVersion} - ${t('bpmn-admin.inner-version')} `;

    return `${version} (${t('bpmn-admin.incidents-count')} ${get(option, 'statistics.incidentCount', 0)})`;
  };

  const getValue = option => {
    const version = option.version ? option.version : `inner_${option.innerVersion}`;

    return String(version);
  };

  const handleGenerate = () => {
    if (!selectedVersion) {
      return;
    }

    const [, sourceProcessDefinitionId] = processId.split('@');
    const [, targetProcessDefinitionId] = selectedVersion.id.split('@');

    Records.query(
      {
        sourceId: 'eproc/bpmn-process-migration',
        query: {
          migrationPlanGeneration: {
            sourceProcessDefinitionId,
            targetProcessDefinitionId,
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
        setSourceProcessDefinitionId(sourceProcessDefinitionId);
        setMigrationPlan(record.migrationPlan);
      }
    });
  };

  const handleMigrate = () => {
    setIsLoading(true);

    const migrationRecord = Records.get('eproc/bpmn-process-migration@');

    migrationRecord.att('action', 'MIGRATE');
    migrationRecord.att('async', true);
    migrationRecord.att('migrationExecution', {
      migrationPlan
    });

    migrationPlan
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

  return (
    <div className={MIGRATION_INFO_BLOCK_CLASS}>
      <div className={`${MIGRATION_INFO_BLOCK_CLASS}__version-select`}>
        <span>{t(Labels.MIGRATION_SELECT_VERSION)}</span>
        <Select
          options={versionsInfo.data}
          value={selectedVersion}
          onChange={setSelectedVersion}
          getOptionLabel={getLabel}
          getOptionValue={getValue}
          menuPlacement="auto"
        />
        <Btn onClick={handleGenerate} disabled={!selectedVersion}>
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

const mapStateToProps = (store, props) => ({
  instanceInfo: selectInstanceMetaInfo(store, props),
  processInfo: selectProcessMetaInfo(store, props),
  versionsInfo: selectProcessVersions(store, props)
});

const mapDispatchToProps = dispatch => ({
  getProcessInfo: processId => dispatch(getMetaInfo({ processId })),
  getAllVersions: (processId, processKey) => dispatch(getAllVersions({ processId, processKey }))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(MigrationInfo);
