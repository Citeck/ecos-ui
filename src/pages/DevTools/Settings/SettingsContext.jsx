import React, { useEffect, useState } from 'react';

import { SETTING_ENABLE_RECORDS_API_DEBUG, SETTING_ENABLE_LOGGING_FOR_NEW_FORMS, SETTING_FORCE_ENABLE_NEW_FORMS } from '../constants';

export const SettingsContext = React.createContext();

export const SettingsContextProvider = props => {
  const initEnableNewForms = !!JSON.parse(localStorage.getItem(SETTING_FORCE_ENABLE_NEW_FORMS));
  const initEnableLoggingNewForm = !!JSON.parse(localStorage.getItem(SETTING_ENABLE_LOGGING_FOR_NEW_FORMS));
  const initEnableRecordsApi = !!JSON.parse(localStorage.getItem(SETTING_ENABLE_RECORDS_API_DEBUG));

  const [stateEnableNewFormsValue, setNewEnableFormsState] = useState(initEnableNewForms);
  const [stateEnableLoggingNewForm, setNewLoggingNewFormState] = useState(initEnableLoggingNewForm);
  const [stateEnableRecordsApi, setNewEnableRecordsApi] = useState(initEnableRecordsApi);
  const [settings, setSettings] = useState({});

  useEffect(
    () => {
      const _setNewValue = value => {
        setNewEnableFormsState(value);
        if (value) {
          localStorage.setItem(SETTING_FORCE_ENABLE_NEW_FORMS, JSON.stringify(value));
        } else {
          localStorage.removeItem(SETTING_FORCE_ENABLE_NEW_FORMS);
        }
      };

      setSettings(prev => ({
        ...prev,
        [SETTING_FORCE_ENABLE_NEW_FORMS]: {
          value: stateEnableNewFormsValue,
          setValue: _setNewValue
        }
      }));
    },
    [stateEnableNewFormsValue]
  );

  useEffect(
    () => {
      const _setNewValue = value => {
        setNewLoggingNewFormState(value);
        if (value) {
          localStorage.setItem(SETTING_ENABLE_LOGGING_FOR_NEW_FORMS, JSON.stringify(value));
        } else {
          localStorage.removeItem(SETTING_ENABLE_LOGGING_FOR_NEW_FORMS);
        }
      };

      setSettings(prev => ({
        ...prev,
        [SETTING_ENABLE_LOGGING_FOR_NEW_FORMS]: {
          value: stateEnableLoggingNewForm,
          setValue: _setNewValue
        }
      }));
    },
    [stateEnableLoggingNewForm]
  );

  useEffect(
    () => {
      const _setNewValue = value => {
        setNewEnableRecordsApi(value);
        if (value) {
          localStorage.setItem(SETTING_ENABLE_RECORDS_API_DEBUG, JSON.stringify(value));
        } else {
          localStorage.removeItem(SETTING_ENABLE_RECORDS_API_DEBUG);
        }
      };

      setSettings(prev => ({
        ...prev,
        [SETTING_ENABLE_RECORDS_API_DEBUG]: {
          value: stateEnableRecordsApi,
          setValue: _setNewValue
        }
      }));
    },
    [stateEnableRecordsApi]
  );

  return <SettingsContext.Provider value={{ settings }}>{props.children}</SettingsContext.Provider>;
};
