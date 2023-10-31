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
      <Dashlet title={t(Labels.WIDGET_TITLE)} setRef={this.setDashletRef} needGoTo={false} disableCollapse>
        <MetaInfoContent instanceId={instanceId} />
      </Dashlet>
    );
  }
}

export default MetaInfoWidget;
