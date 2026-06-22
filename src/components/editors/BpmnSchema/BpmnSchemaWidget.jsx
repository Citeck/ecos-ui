import React from 'react';

import BaseWidget from '@/components/dashboard/widgets/BaseWidget';
import Dashlet from '@/components/dashboard/Dashlet';
import BpmnSchemaContent from './BpmnSchemaContent';
import { t } from '@/helpers/util';

/**
 * Component for drawing bpmn processes. Maybe use it on other bpmns 🤔
 */
class BpmnSchemaWidget extends BaseWidget {
  render() {
    const { activityElement, selectMetaInfo, labels } = this.props;

    return (
      <Dashlet
        title={t(labels.WIDGET_TITLE)}
        onChangeHeight={this.handleChangeHeight}
        getFitHeights={this.setFitHeights}
        setRef={this.setDashletRef}
        needGoTo={false}
        disableCollapse
        onResize={this.handleResize}
        resizable
      >
        <BpmnSchemaContent activityElement={activityElement} selectMetaInfo={selectMetaInfo} labels={labels} />
      </Dashlet>
    );
  }
}

export default BpmnSchemaWidget;
