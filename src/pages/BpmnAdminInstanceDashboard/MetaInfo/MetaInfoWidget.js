import React from 'react';

import BaseWidget from '../../../components/widgets/BaseWidget';
import Dashlet from '../../../components/Dashlet';
import { t } from '../../../helpers/util';
import MetaInfoContent from './MetaInfoContent';
import Labels from './Labels';

import './style.scss';

class MetaInfoWidget extends BaseWidget {
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
        <MetaInfoContent instanceId={instanceId} />
      </Dashlet>
    );
  }
}

export default MetaInfoWidget;
