import get from 'lodash/get';
import isFunction from 'lodash/isFunction';
import isString from 'lodash/isString';
import isUndefined from 'lodash/isUndefined.js';
import React, { useContext, useEffect, useState } from 'react';
import { connect } from 'react-redux';

import { MigrationContext } from '../MigrationContext';
import { SCHEMA_BLOCK_CLASS } from '../constants';

import Labels from './Labels';
import { getProcessLabel, getProcessValue, getVersionLabel, getVersionValue } from './utils';

import { getAllVersions, getMetaInfo } from '@/actions/processAdmin';
import { configureAPI } from '@/api';
import ModelViewer from '@/components/ModelViewer';
import { InfoText, Loader } from '@/components/common';
import PanelTitle from '@/components/common/PanelTitle';
import { COLOR_GRAY } from '@/components/common/PanelTitle/PanelTitle';
import Scaler from '@/components/common/Scaler';
import { ScaleOptions } from '@/components/common/Scaler/util';
import { IcoBtn } from '@/components/common/btns';
import { Select } from '@/components/common/form';
import { URL } from '@/constants';
import { createDocumentUrl, getLastPathSegmentBeforeQuery } from '@/helpers/urls';
import { getKeyProcessBPMN, t } from '@/helpers/util';
import { selectProcessMetaInfo, selectProcessVersions } from '@/selectors/processAdmin';
import PageService from '@/services/PageService';
import { NotificationManager } from '@/services/notifications';

/*  During the initial rendering, the Scaler component does not
    have time to get styles for the environment without this import  */
import '@/components/BpmnSchema/style.scss';

const BpmnSchema = ({ processId, metaInfo, versionsInfo, getMetaInfo, getAllVersions }) => {
  const { api } = configureAPI();
  const typeSchema = getLastPathSegmentBeforeQuery();
  const [designer, setDesigner] = useState(new ModelViewer());

  const [isInitProcesses, setIsInitProcesses] = useState(false);

  const {
    activities,
    setActivities,
    selectedProcess,
    setSelectedProcess,
    setSourceProcessDefinitionId,
    setTargetProcessDefinitionId,
    sourceProcessDefinitionId,
    targetProcessDefinitionId,
    sourceVersion,
    handleChangeProcess,
    setMigrationPlan,
    setProcesses,
    processes
  } = useContext(MigrationContext);

  /* Designer update, if we go through the tabs and come back */
  useEffect(() => {
    if (typeSchema === URL.BPMN_MIGRATION) {
      setDesigner(new ModelViewer());
    }
  }, [typeSchema, processId]);

  const Sheet = designer && designer.renderSheet;
  const zoomCenter = {
    x: 0,
    y: 0
  };

  const handleSelectProcess = () => {
    if (versionsInfo && versionsInfo.data) {
      const selectedVersion = versionsInfo.data.find(item => item.version === Number(sourceVersion) || sourceVersion === item.version);

      if (!selectedVersion) {
        NotificationManager.error(t('migration.error.version-not-found', { sourceVersion }));
        console.error(t('migration.error.version-not-found.info'), versionsInfo.data);
      }

      setSourceProcessDefinitionId(selectedVersion || null);
      if (selectedVersion && metaInfo && metaInfo.version !== sourceVersion) {
        setSelectedProcess(versionsInfo.data.find(version => version === selectedVersion));
      }
    }
  };

  useEffect(() => {
    api.bpmnAdmin
      .getProcesses({
        page: {
          skipCount: 0,
          page: 1,
          maxItems: 1000
        }
      })
      .then(res => {
        if (res?.records) {
          setProcesses(res.records);
        }

        setIsInitProcesses(true);
      })
      .catch(e => {
        NotificationManager.error(t('migration.error.versions'));
        console.error(`${t('migration.error.versions')}:`, e);
        setIsInitProcesses(true);
      });
  }, []);

  useEffect(() => {
    if (!processId) {
      return;
    }

    if (!selectedProcess && processes.length > 0) {
      setSelectedProcess(processes.find(process => process.key === getKeyProcessBPMN(processId)));
    }

    if (selectedProcess && isString(selectedProcess.key)) {
      isFunction(getMetaInfo) && getMetaInfo(processId);
      isFunction(getAllVersions) && !versionsInfo.data && getAllVersions(processId, selectedProcess.key);
    }

    if (!isUndefined(sourceVersion) && !sourceProcessDefinitionId && get(versionsInfo.data, 'length', 0) > 0) {
      handleSelectProcess();
    }
  }, [processId, versionsInfo.data, processes]);

  useEffect(() => {
    if (selectedProcess && !isUndefined(sourceVersion) && get(versionsInfo.data, 'length', 0) > 0) {
      if (sourceProcessDefinitionId && selectedProcess.version !== sourceVersion) {
        handleSelectProcess();
      }
    }
  }, [sourceVersion]);

  useEffect(() => {
    if (sourceProcessDefinitionId) {
      setSelectedProcess(sourceProcessDefinitionId);
    }
  }, [sourceProcessDefinitionId]);

  useEffect(() => {
    setMigrationPlan(prev => {
      if (!prev) {
        return prev;
      }

      if (!activities.length) {
        if (prev.processInstanceQuery) {
          delete prev.processInstanceQuery;

          return { ...prev };
        }

        return { ...prev };
      }

      const [, source] = get(sourceProcessDefinitionId, 'id', '').split('@');

      return {
        ...prev,
        processInstanceQuery: {
          processDefinitionId: source,
          activityIdIn: activities
        }
      };
    });
  }, [activities]);

  const handleReadySheet = ({ mounted, result }) => {
    if (mounted) {
      renderBadges();
    } else {
      console.warn({ result });
    }
  };

  const renderBadges = () => {
    if (!metaInfo || !Array.isArray(metaInfo.activityStatistics)) {
      return;
    }

    const getInstancesCount = item => {
      return item.incidentStatistics.reduce((result, current) => result + current.count, 0);
    };

    designer.drawBadges({
      data: metaInfo.activityStatistics.map(item => ({
        ...item,
        id: item.activityId,
        incidents: getInstancesCount(item) || undefined,
        titles: {
          instances: t('bpmn-admin.process-tabs.process-instances'),
          incidents: t('bpmn-admin.process-tabs.process-incidents')
        }
      })),
      keys: ['instances', 'incidents']
    });
  };

  const handleClickZoom = value => {
    designer.setZoom(value);
  };

  const handleClickElement = (_event, elementInfo) => {
    setActivities(prev => Array.from(new Set([...prev, get(elementInfo, 'element.id')])));
  };

  const showLoader =
    processId && (!metaInfo || metaInfo.loading || (metaInfo && !isUndefined(metaInfo.version) && !sourceProcessDefinitionId));
  const noSchema = processId && !metaInfo.bpmnDefinition;
  const noProcess = !processId;

  const handleLinkClick = href => {
    PageService.changeUrlLink(createDocumentUrl(href), {
      openNewTab: true
    });
  };

  if (showLoader || !isInitProcesses) {
    return <Loader />;
  }

  return (
    <>
      <div className={`${SCHEMA_BLOCK_CLASS}__process-select-wrapper`}>
        <PanelTitle narrow color={COLOR_GRAY}>
          {t(Labels.PROCESS)}
        </PanelTitle>
        <Select
          options={processes}
          value={selectedProcess}
          onChange={handleChangeProcess}
          getOptionLabel={getProcessLabel}
          getOptionValue={getProcessValue}
          className={`${SCHEMA_BLOCK_CLASS}__process-select`}
          formatOptionLabel={(option, { context } = {}) =>
            context === 'value' ? (
              <div className={`${SCHEMA_BLOCK_CLASS}__process-select-label`}>
                {getProcessLabel(option)}
                <IcoBtn className="ecos-btn_transparent" icon="icon-eye-show" onClick={() => handleLinkClick(metaInfo.definitionRefId)} />
              </div>
            ) : (
              getProcessLabel(option)
            )
          }
          menuPlacement="auto"
        />
      </div>

      {noProcess && <InfoText text={t(Labels.NO_PROCESS)} />}
      {noSchema && <InfoText text={t(Labels.NO_SCHEMA)} />}

      {Sheet && !noSchema && !noProcess && (
        <>
          <div className="bpmn-process__scaler">
            <Scaler onClick={handleClickZoom} />
          </div>

          <Sheet
            diagram={metaInfo.bpmnDefinition}
            defHeight={800}
            zoom={ScaleOptions.FIT}
            zoomCenter={zoomCenter}
            onMounted={handleReadySheet}
            modelEvents={{
              'element.click': handleClickElement
            }}
          />
        </>
      )}
      <div className={`${SCHEMA_BLOCK_CLASS}__version-selects`}>
        <div className={`${SCHEMA_BLOCK_CLASS}__select`}>
          <PanelTitle narrow color={COLOR_GRAY}>
            {t(Labels.INITIAL_VERSION)}
          </PanelTitle>
          <Select
            options={versionsInfo.data}
            value={sourceProcessDefinitionId}
            onChange={handleChangeProcess}
            getOptionLabel={getVersionLabel}
            getOptionValue={getVersionValue}
            menuPlacement="auto"
          />
        </div>

        <div className={`${SCHEMA_BLOCK_CLASS}__select`}>
          <PanelTitle narrow color={COLOR_GRAY}>
            {t(Labels.TARGET_VERSION)}
          </PanelTitle>
          <Select
            options={versionsInfo.data}
            value={targetProcessDefinitionId}
            onChange={setTargetProcessDefinitionId}
            getOptionLabel={getVersionLabel}
            getOptionValue={getVersionValue}
            menuPlacement="auto"
          />
        </div>
      </div>
      <div className={`${SCHEMA_BLOCK_CLASS}__activities-container`}>
        <div className={`${SCHEMA_BLOCK_CLASS}__activities-wrapper`}>
          <PanelTitle narrow color={COLOR_GRAY}>
            {t(Labels.BPMN_ELEMENTS)}
          </PanelTitle>
          {!activities.length && (
            <div className="alert alert-primary" role="alert">
              {t(Labels.BPMN_ELEMENTS_REMIND)}
            </div>
          )}
          <div className={`${SCHEMA_BLOCK_CLASS}__activities`}>
            {activities.map(activityId => (
              <div className={`${SCHEMA_BLOCK_CLASS}__activities-item`}>
                <span>{activityId}</span>
                <IcoBtn
                  className="ecos-btn_transparent"
                  icon="icon-small-close"
                  onClick={() => setActivities(prev => [...prev.filter(item => item !== activityId)])}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

const mapStateToProps = (store, props) => ({
  metaInfo: selectProcessMetaInfo(store, props),
  versionsInfo: selectProcessVersions(store, props)
});

const mapDispatchToProps = dispatch => ({
  getMetaInfo: processId => dispatch(getMetaInfo({ processId })),
  getAllVersions: (processId, processKey) => dispatch(getAllVersions({ processId, processKey }))
});

export default connect(mapStateToProps, mapDispatchToProps)(BpmnSchema);
