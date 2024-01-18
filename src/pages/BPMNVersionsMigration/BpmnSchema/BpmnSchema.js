import React, { useContext, useEffect } from 'react';
import { connect } from 'react-redux';
import get from 'lodash/get';
import isFunction from 'lodash/isFunction';
import isString from 'lodash/isString';

import { ScaleOptions } from '../../../components/common/Scaler/util';
import { t } from '../../../helpers/util';
import { IcoBtn } from '../../../components/common/btns';
import { selectProcessMetaInfo, selectProcessVersions } from '../../../selectors/processAdmin';
import { getAllVersions, getMetaInfo } from '../../../actions/processAdmin';
import { Select } from '../../../components/common/form';
import { getProcesses } from '../../../actions/bpmnAdmin';
import PanelTitle from '../../../components/common/PanelTitle';
import { COLOR_GRAY } from '../../../components/common/PanelTitle/PanelTitle';
import PageService from '../../../services/PageService';
import { createDocumentUrl } from '../../../helpers/urls';
import { InfoText } from '../../../components/common';
import { MigrationContext } from '../MigrationContext';
import { SCHEMA_BLOCK_CLASS } from '../constants';
import { getProcessLabel, getProcessValue, getVersionLabel, getVersionValue } from './utils';
import Labels from './Labels';

const BpmnSchema = ({ designer, processId, metaInfo, versionsInfo, processes, getMetaInfo, getProcesses, getAllVersions }) => {
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
    setMigrationPlan
  } = useContext(MigrationContext);

  const Sheet = designer && designer.renderSheet;
  const zoomCenter = {
    x: 0,
    y: 0
  };

  useEffect(() => {
    isFunction(getProcesses) && getProcesses(true);
  }, []);

  useEffect(
    () => {
      if (processId && processes.length > 0) {
        setSelectedProcess(processes.find(process => process.id === `eproc/bpmn-def-engine@${processId}`));
      }
    },
    [processes]
  );

  useEffect(
    () => {
      if (!processId) {
        return;
      }

      if (selectedProcess && isString(selectedProcess.key)) {
        isFunction(getMetaInfo) && getMetaInfo(processId);
        isFunction(getAllVersions) && !versionsInfo.data && getAllVersions(processId, selectedProcess.key);
      }

      if (sourceVersion && !sourceProcessDefinitionId && get(versionsInfo.data, 'length', 0) > 0) {
        const selectedVersion = versionsInfo.data.find(item => item.version === Number(sourceVersion));
        setSourceProcessDefinitionId(selectedVersion || null);
      }
    },
    [processId, versionsInfo.data]
  );

  useEffect(
    () => {
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
    },
    [activities]
  );

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

  const handleClickElement = (_event, elementInfo) => {
    setActivities(prev => Array.from(new Set([...prev, get(elementInfo, 'element.id')])));
  };

  const noSchema = processId && !metaInfo.bpmnDefinition;
  const noProcess = !processId;

  const handleLinkClick = href => {
    PageService.changeUrlLink(createDocumentUrl(href), {
      openNewTab: true
    });
  };

  return (
    <>
      <div className={`${SCHEMA_BLOCK_CLASS}__process-select-wrapper`}>
        <PanelTitle narrow color={COLOR_GRAY}>
          {t(Labels.PROCESS)}
        </PanelTitle>
        <Select
          options={processes}
          value={selectedProcess}
          onChange={setSelectedProcess}
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
      )}
      <div className={`${SCHEMA_BLOCK_CLASS}__version-selects`}>
        <div className={`${SCHEMA_BLOCK_CLASS}__select`}>
          <PanelTitle narrow color={COLOR_GRAY}>
            {t(Labels.INITIAL_VERSION)}
          </PanelTitle>
          <Select
            options={versionsInfo.data}
            value={sourceProcessDefinitionId}
            onChange={setSourceProcessDefinitionId}
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
    </>
  );
};

const mapStateToProps = (store, props) => ({
  metaInfo: selectProcessMetaInfo(store, props),
  versionsInfo: selectProcessVersions(store, props),

  processes: store.bpmnAdmin.processes
});

const mapDispatchToProps = dispatch => ({
  getMetaInfo: processId => dispatch(getMetaInfo({ processId })),
  getProcesses: allRecords => dispatch(getProcesses({ allRecords })),
  getAllVersions: (processId, processKey) => dispatch(getAllVersions({ processId, processKey }))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(BpmnSchema);
