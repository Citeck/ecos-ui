import React from 'react';

import { default as EcosTabs } from '../../../components/common/Tabs';
import { t } from '../../../helpers/util';

import { TABS } from '../constants';
import { useContext } from '../DevToolsContext';

const Tabs = () => {
  const context = useContext();
  const { activeTab, setActiveTab } = context;

  const tabs = [
    {
      id: TABS.BUILD,
      label: t('dev-tools.tab.build')
    },
    {
      id: TABS.DEV_MODULES,
      label: t('dev-tools.tab.dev-modules')
    },
    {
      id: TABS.COMMITS,
      label: t('dev-tools.tab.commits')
    },
    {
      id: TABS.SETTINGS,
      label: t('dev-tools.tab.settings')
    }
  ].map(item => {
    return {
      ...item,
      isActive: item.id === activeTab,
      onClick: () => {
        setActiveTab(item.id);
      }
    };
  });

  return (
    <div className="dev-tools-page__tabs">
      <EcosTabs items={tabs} narrow />
    </div>
  );
};

export default Tabs;
