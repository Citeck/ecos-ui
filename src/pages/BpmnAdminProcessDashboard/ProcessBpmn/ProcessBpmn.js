import React from 'react';
import { connect } from 'react-redux';

import Dashlet from '../../../components/Dashlet';
import { InfoText, Loader, ResizableBox, Scaler } from '../../../components/common';
import BPMNViewer from '../../../components/ModelViewer/BPMNViewer';
import { selectProcessMetaInfo } from '../../../selectors/processAdmin';
import { ScaleOptions } from '../../../components/common/Scaler/util';
import BaseWidget from '../../../components/widgets/BaseWidget';
import { t } from '../../../helpers/util';

import './style.scss';

class ProcessBpmn extends BaseWidget {
  constructor(props) {
    super(props);

    this.designer = new BPMNViewer();
  }

  get zoomCenter() {
    return {
      x: 0,
      y: 0
    };
  }

  setHeight = height => {
    this.designer && this.designer.setHeight(height);
  };

  handleReadySheet = ({ mounted, result }) => {
    if (mounted) {
      this.renderBadges();
    } else {
      console.warn({ result });
    }
  };

  handleClickZoom = value => {
    this.designer.setZoom(value);
  };

  renderBadges = () => {
    const { metaInfo } = this.props;

    if (!metaInfo || !Array.isArray(metaInfo.activityStatistics)) {
      return;
    }

    const getInstancesCount = item => {
      return item.incidentStatistics.reduce((result, current) => result + current.count, 0);
    };

    this.designer.drawBadges({
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

  render() {
    const { activityElement, metaInfo } = this.props;

    const showLoader = !metaInfo || metaInfo.bpmnDefinition === undefined;
    const noData = metaInfo && metaInfo.bpmnDefinition === null;

    const Sheet = this.designer && this.designer.renderSheet;
    const zoomCenter = {
      x: 0,
      y: 0
    };

    return (
      <Dashlet
        title={t('bpmn-admin.schema')}
        onChangeHeight={this.handleChangeHeight}
        getFitHeights={this.setFitHeights}
        onToggleCollapse={this.handleToggleContent}
        isCollapsed={this.isCollapsed}
        setRef={this.setDashletRef}
        onResize={this.handleResize}
        needGoTo={false}
        resizable
      >
        {showLoader && <Loader />}
        {!showLoader && !noData && (
          <>
            <div className="bpmn-process__scaler">
              <Scaler onClick={this.handleClickZoom} />
            </div>
            <ResizableBox getHeight={this.setHeight} resizable>
              {Sheet && (
                <Sheet
                  diagram={metaInfo.bpmnDefinition}
                  defHeight={600}
                  zoom={ScaleOptions.FIT}
                  zoomCenter={zoomCenter}
                  onMounted={this.handleReadySheet}
                  markedElement={activityElement}
                />
              )}
            </ResizableBox>
          </>
        )}
        {noData && <InfoText text={t('bpmn-admin.incident.no-schema')} />}
      </Dashlet>
    );
  }
}

const mapStateToProps = (store, props) => {
  return {
    metaInfo: selectProcessMetaInfo(store, props)
  };
};

export default connect(mapStateToProps)(ProcessBpmn);
