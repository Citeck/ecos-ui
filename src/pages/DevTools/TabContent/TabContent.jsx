import React from 'react';

import { Wall } from '../../../components/common/form';
import { useContext } from '../DevToolsContext';
import { TABS } from '../constants';
import BuildTab from '../Build';
import DevModulesTab from '../DevModules';
import CommitsTab from '../Commits';
import SettingsTab from '../Settings';

const TabContent = () => {
  const context = useContext();
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
    <Wall className="dev-tools-page__tab-content">
      <TabComponent />
    </Wall>
  );
};

export default TabContent;
