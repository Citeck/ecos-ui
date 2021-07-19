import React, { useState } from 'react';
import PropTypes from 'prop-types';

import { TABS } from './constants';

import { BuildContextProvider } from './Build/BuildContext';
import { DevModulesContextProvider } from './DevModules/DevModulesContext';
import { CommitsContextProvider } from './Commits/CommitsContext';
import { SettingsContextProvider } from './Settings/SettingsContext';

export const DevToolsContext = React.createContext();

export const useContext = () => React.useContext(DevToolsContext);

export const DevToolsContextProvider = props => {
  let defaultActiveTab = TABS.BUILD;
  if (Object.values(TABS).includes(props.activeTab)) {
    defaultActiveTab = props.activeTab;
  }
  const [activeTab, setActiveTab] = useState(defaultActiveTab);

  const _setActiveTab = tabId => {
    setActiveTab(tabId);
    if (typeof props.setActiveTab === 'function') {
      props.setActiveTab(tabId);
    }
  };

  return (
    <DevToolsContext.Provider
      value={{
        activeTab,
        setActiveTab: _setActiveTab
      }}
    >
      <BuildContextProvider>
        <DevModulesContextProvider>
          <CommitsContextProvider>
            <SettingsContextProvider>{props.children}</SettingsContextProvider>
          </CommitsContextProvider>
        </DevModulesContextProvider>
      </BuildContextProvider>
    </DevToolsContext.Provider>
  );
};

DevToolsContextProvider.propTypes = {
  activeTab: PropTypes.oneOf(Object.values(TABS)),
  setActiveTab: PropTypes.func
};