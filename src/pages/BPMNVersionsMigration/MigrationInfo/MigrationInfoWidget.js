import React from 'react';
import { connect } from 'react-redux';

import { selectInstanceMetaInfo } from '../../../selectors/instanceAdmin';
import BaseWidget from '../../../components/widgets/BaseWidget';
import Dashlet from '../../../components/Dashlet';
import { t } from '../../../helpers/util';
import MigrationInfo from './MigrationInfo';
import Labels from './Labels';

import './style.scss';
class MigrationInfoWidget extends BaseWidget {
  render() {
    const { instanceId, instanceInfo } = this.props;

    return (
      <Dashlet
        title={t(Labels.MIGRATION_WIDGET_TITLE)}
        needGoTo={false}
        onToggleCollapse={this.handleToggleContent}
        isCollapsed={this.isCollapsed}
        setRef={this.setDashletRef}
      >
        <MigrationInfo instanceId={instanceId} processId={instanceInfo.bpmnDefEngine} />
      </Dashlet>
    );
  }
}

const mapStateToProps = (store, props) => ({
  instanceInfo: selectInstanceMetaInfo(store, props)
});

export default connect(mapStateToProps)(MigrationInfoWidget);
