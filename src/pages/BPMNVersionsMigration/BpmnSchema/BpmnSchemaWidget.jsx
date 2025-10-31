import React from 'react';

import BaseWidget from '../../../components/widgets/BaseWidget';
import Dashlet from '../../../components/Dashlet';
import { t } from '../../../helpers/util';
import BpmnSchema from './BpmnSchema';
import Labels from './Labels';

import './style.scss';

class BpmnSchemaWidget extends BaseWidget {
  render() {
    const { processId } = this.props;

    return (
      <Dashlet
        title={t(Labels.BPMN_SCHEMA_TITLE)}
        needGoTo={false}
        onToggleCollapse={this.handleToggleContent}
        isCollapsed={this.isCollapsed}
        setRef={this.setDashletRef}
      >
        <BpmnSchema processId={processId} />
      </Dashlet>
    );
  }
}

export default BpmnSchemaWidget;
