import React, { useContext, useEffect, useState } from 'react';
import { connect } from 'react-redux';

import get from 'lodash/get';

import ModelViewer from '../../../components/ModelViewer/BPMNViewer';
import { selectInstanceMetaInfo } from '../../../selectors/instanceAdmin';
import { ScaleOptions } from '../../../components/common/Scaler/util';
import { t } from '../../../helpers/util';
import { MigrationContext } from '../MigrationContext';
import { SCHEMA_BLOCK_CLASS } from '../constants';
import { IcoBtn } from '../../../components/common/btns';

const designer = new ModelViewer();
const Sheet = designer && designer.renderSheet;
const zoomCenter = {
  x: 0,
  y: 0
};

const BpmnSchema = ({ metaInfo }) => {
  const { migrationPlan, setMigrationPlan, sourceProcessDefinitionId } = useContext(MigrationContext);

  const [activities, setActivities] = useState([]);

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

        return {
          ...prev,
          processInstanceQuery: {
            processDefinitionId: sourceProcessDefinitionId,
            activityIdIn: activities
          }
        };
      });
    },
    [activities, migrationPlan]
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
    setActivities(prev => [...prev, get(elementInfo, 'element.id')]);
  };

  return (
    <>
      {Sheet && (
        <Sheet
          diagram={metaInfo.bpmnDefinition}
          defHeight={600}
          zoom={ScaleOptions.FIT}
          zoomCenter={zoomCenter}
          onMounted={handleReadySheet}
          modelEvents={{
            'element.click': handleClickElement
          }}
        />
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
    </>
  );
};

const mapStateToProps = (store, props) => ({
  metaInfo: selectInstanceMetaInfo(store, props)
});

export default connect(mapStateToProps)(BpmnSchema);
