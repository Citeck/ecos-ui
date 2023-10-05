import React from 'react';

import BaseWidget from '../../../components/widgets/BaseWidget';
import Dashlet from '../../../components/Dashlet';
import { t } from '../../../helpers/util';
import BpmnSchemaContent from './BpmnSchemaContent';
import Labels from './Labels';

class BpmnSchemaWidget extends BaseWidget {
  render() {
    const { instanceId } = this.props;

    return (
      <Dashlet
        title={t(Labels.WIDGET_TITLE)}
        needGoTo={false}
        onToggleCollapse={this.handleToggleContent}
        isCollapsed={this.isCollapsed}
        setRef={this.setDashletRef}
      >
        <BpmnSchemaContent instanceId={instanceId} />
      </Dashlet>
    );
  }
}

export default BpmnSchemaWidget;
