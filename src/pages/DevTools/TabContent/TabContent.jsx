import React, { useContext } from 'react';

import Well from '../../../components/common/form/Well';

import { DevToolsContext } from '../DevToolsContext';
import { TABS } from '../constants';
import BuildTab from '../Build';
import DevModulesTab from '../DevModules';
import CommitsTab from '../Commits';
import SettingsTab from '../Settings';

const TabContent = () => {
  const context = useContext(DevToolsContext);
  const { activeTab } = context;

  let TabComponent = null;
  switch (activeTab) {
    case TABS.DEV_MODULES:
      TabComponent = DevModulesTab;
      break;
    case TABS.COMMITS:
      TabComponent = CommitsTab;
      break;
    case TABS.SETTINGS:
      TabComponent = SettingsTab;
      break;
    case TABS.BUILD:
    default:
      TabComponent = BuildTab;
  }

  return (
    <Well className="dev-tools-page__tab-content">
      <TabComponent />
    </Well>
  );
};

export default TabContent;
