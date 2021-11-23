import React from 'react';
import PropTypes from 'prop-types';
import isFunction from 'lodash/isFunction';

import { TABS } from './constants';

import { BuildContextProvider } from './Build/BuildContext';
import { DevModulesContextProvider } from './DevModules/DevModulesContext';
import { CommitsContextProvider } from './Commits/CommitsContext';
import { SettingsContextProvider } from './Settings/SettingsContext';

export const DevToolsContext = React.createContext({});

export const useContext = () => React.useContext(DevToolsContext);

export class DevToolsContextProvider extends React.Component {
  constructor(props) {
    super(props);

    let defaultActiveTab = TABS.BUILD;

    if (Object.values(TABS).includes(props.activeTab)) {
      defaultActiveTab = props.activeTab;
    }

    this.state = {
      activeTab: defaultActiveTab
    };
  }

  setActiveTab = activeTab => {
    const { setActiveTab } = this.props;

    this.setState({ activeTab });

    isFunction(setActiveTab) && setActiveTab(activeTab);
  };

  render() {
    const { activeTab, children } = this.props;

    return (
      <DevToolsContext.Provider
        value={{
          activeTab,
          setActiveTab: this.setActiveTab
        }}
      >
        <BuildContextProvider>
          <DevModulesContextProvider>
            <CommitsContextProvider>
              <SettingsContextProvider>{children}</SettingsContextProvider>
            </CommitsContextProvider>
          </DevModulesContextProvider>
        </BuildContextProvider>
      </DevToolsContext.Provider>
    );
  }
}

DevToolsContextProvider.propTypes = {
  activeTab: PropTypes.oneOf(Object.values(TABS)),
  setActiveTab: PropTypes.func
};
