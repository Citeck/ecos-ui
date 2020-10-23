import React, { useContext } from 'react';
import { Row, Col } from 'reactstrap';

import { t } from '../../../helpers/util';

import { SettingsContext } from './SettingsContext';
import Setting from './Setting';
import SwitchSetting from './SwitchSetting';

const SettingsTab = () => {
  const context = useContext(SettingsContext);
  const { forceEnableNewForms, setForceEnableNewForms, enableLoggerForNewForms, setEnableLoggerForNewForms } = context;

  return (
    <Row>
      <Col xl={4} lg={6}>
        <Setting title={t('dev-tools.settings.force-enable-new-forms')}>
          <SwitchSetting
            checked={forceEnableNewForms}
            onToggle={setForceEnableNewForms}
            label={forceEnableNewForms ? t('dev-tools.settings.on') : t('dev-tools.settings.off')}
          />
        </Setting>
      </Col>
      <Col xl={4} lg={6}>
        <Setting title={t('dev-tools.settings.enable-logger-for-new-forms')}>
          <SwitchSetting
            checked={enableLoggerForNewForms}
            onToggle={setEnableLoggerForNewForms}
            label={enableLoggerForNewForms ? t('dev-tools.settings.on') : t('dev-tools.settings.off')}
          />
        </Setting>
      </Col>
    </Row>
  );
};

export default SettingsTab;
