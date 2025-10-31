import React from 'react';

import Dashlet from '../../../components/Dashlet';
import BaseWidget from '../../../components/widgets/BaseWidget';
import { t } from '../../../helpers/util';
import ProcessTabs from './ProcessTabs';
import ProcessTabContent from './ProcessTabContent';

import './style.scss';

class ProcessJournal extends BaseWidget {
  render() {
    return (
      <Dashlet title={t('bpmn-admin.journal')} needGoTo={false} setRef={this.setDashletRef} disableCollapse>
        <div className="journal-widget__body">
          <ProcessTabs />
          <ProcessTabContent />
        </div>
      </Dashlet>
    );
  }
}

export default ProcessJournal;
