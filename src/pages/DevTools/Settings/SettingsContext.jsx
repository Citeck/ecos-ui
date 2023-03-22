import React, { useState } from 'react';

import { SETTING_ENABLE_RECORDS_API_DEBUG, SETTING_ENABLE_LOGGING_FOR_NEW_FORMS, SETTING_FORCE_ENABLE_NEW_FORMS } from '../constants';

export const SettingsContext = React.createContext();

export const SettingsContextProvider = props => {
  const settings = {};
  [SETTING_FORCE_ENABLE_NEW_FORMS, SETTING_ENABLE_LOGGING_FOR_NEW_FORMS, SETTING_ENABLE_RECORDS_API_DEBUG].forEach(prop => {
    const initState = !!JSON.parse(localStorage.getItem(prop));
    const [stateValue, setNewState] = useState(initState);

    const _setNewValue = value => {
      setNewState(value);
      if (value) {
        localStorage.setItem(prop, JSON.stringify(value));
      } else {
        localStorage.removeItem(prop);
      }
    };

    settings[prop] = {
      value: stateValue,
      setValue: _setNewValue
    };
  });

  return <SettingsContext.Provider value={{ settings }}>{props.children}</SettingsContext.Provider>;
};
