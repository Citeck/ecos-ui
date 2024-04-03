import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';

import { getLastPathSegmentBeforeQuery, getSearchParams } from '../../helpers/urls';
import { InfoText, Loader, ResizableBox } from '../common';
import BPMNViewer from '../ModelViewer/BPMNViewer';
import { ScaleOptions } from '../common/Scaler/util';
import Scaler from '../common/Scaler';
import { t } from '../../helpers/util';
import { URL } from '../../constants';

import './style.scss';

const BpmnSchemaContent = ({ metaInfo, activityElement, labels }) => {
  const typeSchema = getLastPathSegmentBeforeQuery();
  const [designer, setDesigner] = useState(new BPMNViewer());

  const currentKeyProcess = getSearchParams()
    .recordRef?.split('@')[1]
    ?.split(':')[0];

  /* Updating the Designer if we went through the tabs or switched to other business processes */
  useEffect(
    () => {
      if (typeSchema === URL.BPMN_ADMIN_PROCESS) {
        setDesigner(new BPMNViewer());
      }
    },
    [typeSchema, currentKeyProcess]
  );

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
