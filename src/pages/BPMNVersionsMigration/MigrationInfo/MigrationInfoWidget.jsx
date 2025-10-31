import React from 'react';

import BaseWidget from '../../../components/widgets/BaseWidget';
import Dashlet from '../../../components/Dashlet';
import { t } from '../../../helpers/util';
import MigrationInfo from './MigrationInfo';
import Labels from './Labels';

import './style.scss';
class MigrationInfoWidget extends BaseWidget {
  render() {
    const { processId } = this.props;

    return (
      <Dashlet
        title={t(Labels.MIGRATION_WIDGET_TITLE)}
        needGoTo={false}
        onToggleCollapse={this.handleToggleContent}
        isCollapsed={this.isCollapsed}
        setRef={this.setDashletRef}
      >
        <MigrationInfo processId={processId} />
      </Dashlet>
    );
  }
}

export default MigrationInfoWidget;
