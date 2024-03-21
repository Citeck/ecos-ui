import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';

import { InfoText, Loader, ResizableBox } from '../common';
import BPMNViewer from '../ModelViewer/BPMNViewer';
import { ScaleOptions } from '../common/Scaler/util';
import Scaler from '../common/Scaler';
import { t } from '../../helpers/util';

import './style.scss';

const BpmnSchemaContent = ({ metaInfo, activityElement, labels }) => {
  const [designer, setDesigner] = useState(undefined);
  useEffect(() => {
    setDesigner(new BPMNViewer());
  }, []);

  const Sheet = designer && designer.renderSheet;
  const zoomCenter = {
    x: 0,
    y: 0
  };

  const setHeight = height => {
    designer && designer.setHeight(height);
  };

  const showLoader = !metaInfo || metaInfo.bpmnDefinition === undefined;
  const noData = metaInfo && metaInfo.bpmnDefinition === null;

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

  const handleReadySheet = ({ mounted, result }) => {
    if (mounted) {
      renderBadges();
    } else {
      console.warn({ result });
    }
  };

  if (!designer) {
    return null;
  }

  return (
    <>
      {showLoader && <Loader />}
      {Sheet && !showLoader && !noData && (
        <>
          <div className="bpmn-process__scaler">
            <Scaler onClick={handleClickZoom} />
          </div>

          <ResizableBox getHeight={setHeight} resizable>
            <Sheet
              diagram={metaInfo.bpmnDefinition}
              onMounted={handleReadySheet}
              defHeight={600}
              zoom={ScaleOptions.FIT}
              zoomCenter={zoomCenter}
              markedElement={activityElement}
            />
          </ResizableBox>
        </>
      )}
      {noData && <InfoText text={t(labels.NO_SCHEMA)} />}
    </>
  );
};

const mapStateToProps = (store, props) => ({
  metaInfo: props.selectMetaInfo(store, props)
});

export default connect(mapStateToProps)(BpmnSchemaContent);
