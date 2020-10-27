import React, { useState } from 'react';

export const SettingsContext = React.createContext();

const SETTING_FORCE_ENABLE_NEW_FORMS = 'forceEnableNewForms';
const SETTING_ENABLE_LOGGING_FOR_NEW_FORMS = 'enableLoggerForNewForms';

export const SettingsContextProvider = props => {
  const forceEnableNewFormsInitState = !!JSON.parse(localStorage.getItem(SETTING_FORCE_ENABLE_NEW_FORMS));
  const [forceEnableNewForms, setForceEnableNewForms] = useState(forceEnableNewFormsInitState);
  const _setForceEnableNewForms = value => {
    setForceEnableNewForms(value);
    if (value) {
      localStorage.setItem(SETTING_FORCE_ENABLE_NEW_FORMS, JSON.stringify(value));
    } else {
      localStorage.removeItem(SETTING_FORCE_ENABLE_NEW_FORMS);
    }
  };

  const enableLoggerForNewFormsInitState = !!JSON.parse(localStorage.getItem(SETTING_ENABLE_LOGGING_FOR_NEW_FORMS));
  const [enableLoggerForNewForms, setEnableLoggerForNewForms] = useState(enableLoggerForNewFormsInitState);
  const _setEnableLoggerForNewForms = value => {
    setEnableLoggerForNewForms(value);
    if (value) {
      localStorage.setItem(SETTING_ENABLE_LOGGING_FOR_NEW_FORMS, JSON.stringify(value));
    } else {
      localStorage.removeItem(SETTING_ENABLE_LOGGING_FOR_NEW_FORMS);
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        forceEnableNewForms,
        setForceEnableNewForms: _setForceEnableNewForms,
        enableLoggerForNewForms,
        setEnableLoggerForNewForms: _setEnableLoggerForNewForms
      }}
    >
      {props.children}
    </SettingsContext.Provider>
  );
};
