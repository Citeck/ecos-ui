import React, { useEffect, useState } from 'react';

import {
  SETTING_ENABLE_RECORDS_API_DEBUG,
  SETTING_ENABLE_LOGGING_FOR_NEW_FORMS,
  SETTING_FORCE_ENABLE_NEW_FORMS,
  SETTING_ENABLE_VIEW_NEW_JOURNAL,
  SETTING_ENABLE_SAGA_LOGGER
} from '../constants';

import ConfigService, { ALFRESCO_ENABLED } from '@/services/config/ConfigService';

export const SettingsContext = React.createContext();

export const SettingsContextProvider = props => {
  const initEnableSagaLogger = !!JSON.parse(localStorage.getItem(SETTING_ENABLE_SAGA_LOGGER));
  const initEnableNewForms = !!JSON.parse(localStorage.getItem(SETTING_FORCE_ENABLE_NEW_FORMS));
  const initEnableLoggingNewForm = !!JSON.parse(localStorage.getItem(SETTING_ENABLE_LOGGING_FOR_NEW_FORMS));
  const initEnableRecordsApi = !!JSON.parse(localStorage.getItem(SETTING_ENABLE_RECORDS_API_DEBUG));
  const initEnableViewNewJournal = !!JSON.parse(localStorage.getItem(SETTING_ENABLE_VIEW_NEW_JOURNAL));

  const [stateEnableSagaLogger, setNewEnableSagaLogger] = useState(initEnableSagaLogger);
  const [stateEnableNewFormsValue, setNewEnableFormsState] = useState(initEnableNewForms);
  const [stateEnableLoggingNewForm, setNewLoggingNewFormState] = useState(initEnableLoggingNewForm);
  const [stateEnableRecordsApi, setNewEnableRecordsApi] = useState(initEnableRecordsApi);
  const [stateEnableViewNewJournal, setNewEnableViewNewJournal] = useState(initEnableViewNewJournal);
  const [settings, setSettings] = useState({});

  useEffect(() => {
    const _setNewValue = value => {
      setNewEnableSagaLogger(value);

      if (value) {
        localStorage.setItem(SETTING_ENABLE_SAGA_LOGGER, JSON.stringify(value));
      } else {
        localStorage.removeItem(SETTING_ENABLE_SAGA_LOGGER);
      }
    };

    setSettings(prev => ({
      ...prev,
      [SETTING_ENABLE_SAGA_LOGGER]: {
        value: stateEnableSagaLogger,
        setValue: _setNewValue
      }
    }));
  }, [stateEnableSagaLogger]);

  useEffect(() => {
    const _setNewValue = value => {
      setNewEnableFormsState(value);
      if (value) {
        localStorage.setItem(SETTING_FORCE_ENABLE_NEW_FORMS, JSON.stringify(value));
      } else {
        localStorage.removeItem(SETTING_FORCE_ENABLE_NEW_FORMS);
      }
    };

    ConfigService.getValue(ALFRESCO_ENABLED).then(value => {
      if (!value) {
        return;
      }

      setSettings(prev => ({
        ...prev,
        [SETTING_FORCE_ENABLE_NEW_FORMS]: {
          value: stateEnableNewFormsValue,
          setValue: _setNewValue
        }
      }));
    });
  }, [stateEnableNewFormsValue]);

  useEffect(() => {
    const _setNewValue = value => {
      setNewEnableViewNewJournal(value);

      if (value) {
        localStorage.setItem(SETTING_ENABLE_VIEW_NEW_JOURNAL, JSON.stringify(value));
      } else {
        localStorage.removeItem(SETTING_ENABLE_VIEW_NEW_JOURNAL);
      }
    };

    setSettings(prev => ({
      ...prev,
      [SETTING_ENABLE_VIEW_NEW_JOURNAL]: {
        value: stateEnableViewNewJournal,
        setValue: _setNewValue
      }
    }));
  }, [initEnableViewNewJournal]);

  useEffect(() => {
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
  }, [stateEnableLoggingNewForm]);

  useEffect(() => {
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
  }, [stateEnableRecordsApi]);

  return <SettingsContext.Provider value={{ settings }}>{props.children}</SettingsContext.Provider>;
};
