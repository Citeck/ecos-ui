import React from 'react';

import BaseWidget from '../../../components/widgets/BaseWidget';
import Dashlet from '../../../components/Dashlet';
import { t } from '../../../helpers/util';
import InfoPanel from './InfoPanel';
import Labels from './Labels';

import './style.scss';

class InfoPanelWidget extends BaseWidget {
  render() {
    const { instanceId } = this.props;

    return (
      <Dashlet
        title={t(Labels.META_INFO_WIDGET_TITLE)}
        needGoTo={false}
        onToggleCollapse={this.handleToggleContent}
        isCollapsed={this.isCollapsed}
        setRef={this.setDashletRef}
      >
        <InfoPanel instanceId={instanceId} />
      </Dashlet>
    );
  }
}

export default InfoPanelWidget;
