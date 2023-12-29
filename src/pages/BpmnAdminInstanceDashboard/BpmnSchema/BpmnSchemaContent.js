import React, { useContext } from 'react';
import { connect } from 'react-redux';

import { selectInstanceMetaInfo } from '../../../selectors/instanceAdmin';
import { InfoText, Loader, ResizableBox } from '../../../components/common';
import BPMNViewer from '../../../components/ModelViewer/BPMNViewer';
import { ScaleOptions } from '../../../components/common/Scaler/util';
import { t } from '../../../helpers/util';
import { InstanceContext } from '../InstanceContext';
import Labels from './Labels';

const BpmnSchemaContent = ({ metaInfo }) => {
  const context = useContext(InstanceContext);

  const designer = new BPMNViewer();
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

  const handleReadySheet = ({ mounted, result }) => {
    if (mounted) {
      renderBadges();
    } else {
      console.warn({ result });
    }
  };

  return (
    <>
      <ResizableBox getHeight={setHeight} resizable>
        {showLoader && <Loader />}
        {!showLoader && !noData && (
          <>
            {Sheet && (
              <Sheet
                diagram={metaInfo.bpmnDefinition}
                onMounted={handleReadySheet}
                defHeight={600}
                zoom={ScaleOptions.FIT}
                zoomCenter={zoomCenter}
                markedElement={context.activityElement}
              />
            )}
          </>
        )}
        {noData && <InfoText text={t(Labels.NO_SCHEMA)} />}
      </ResizableBox>
    </>
  );
};

const mapStateToProps = (store, props) => ({
  metaInfo: selectInstanceMetaInfo(store, props)
});

export default connect(mapStateToProps)(BpmnSchemaContent);
