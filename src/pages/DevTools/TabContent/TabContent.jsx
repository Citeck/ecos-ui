import React from 'react';

import { Well } from '../../../components/common/form';
import BuildTab from '../Build';
import CommitsTab from '../Commits';
import DevModulesTab from '../DevModules';
import { useContext } from '../DevToolsContext';
import SettingsTab from '../Settings';
import { TABS } from '../constants';

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
    <Well className="dev-tools-page__tab-content">
      <TabComponent />
    </Well>
  );
};

export default TabContent;
