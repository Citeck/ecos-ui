import React from 'react';
import PropTypes from 'prop-types';

import Switch from '../../../../components/common/form/Checkbox/Switch';

const SwitchSetting = ({ checked, onToggle, label }) => {
  return (
    <div className="dev-tools-page__switch-setting">
      <Switch checked={checked} onToggle={onToggle} />
      {label}
    </div>
  );
};

SwitchSetting.propTypes = {
  checked: PropTypes.bool,
  onToggle: PropTypes.func,
  label: PropTypes.string
};

export default SwitchSetting;
