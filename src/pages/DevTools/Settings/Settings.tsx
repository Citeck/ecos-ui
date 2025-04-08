import React, { useContext } from 'react';
// @ts-ignore
import { Row, Col } from 'reactstrap';

import { t } from '../../../helpers/util';

import Setting from './Setting';
import { SettingsContext } from './SettingsContext';
import SwitchSetting from './SwitchSetting';

const SettingsTab = (): React.JSX.Element => {
  const context = useContext(SettingsContext);
  const { settings = {} } = context;

  const settingsSwitches = Object.keys(settings).map(settingKey => {
    const setting = settings[settingKey];

    return (
      <Col xl={4} lg={6} key={settingKey}>
        <Setting title={t(`dev-tools.settings.${settingKey}`)}>
          <SwitchSetting
            checked={setting.value}
            onToggle={setting.setValue}
            label={setting.value ? t('dev-tools.settings.on') : t('dev-tools.settings.off')}
          />
        </Setting>
      </Col>
    );
  });

  return <Row>{settingsSwitches}</Row>;
};

export default SettingsTab;
