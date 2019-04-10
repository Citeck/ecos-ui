import React, { useContext, useMemo } from 'react';
import { default as EcosTabs } from '../../../../../Tabs';
import { SelectModalContext } from '../SelectModalContext';
import { t } from '../../../../../../../helpers/util';
import { TAB_BY_LEVELS, TAB_ONLY_SELECTED } from '../constants';

function getTabItems() {
  return [
    {
      id: TAB_BY_LEVELS,
      label: t('select-orgstruct.tab.by-levels')
    },
    {
      id: TAB_ONLY_SELECTED,
      label: t('select-orgstruct.tab.only-selected')
    }
  ];
}

const Tabs = () => {
  const context = useContext(SelectModalContext);
  const { currentTab, setCurrentTab } = context;

  const tabs = useMemo(() => getTabItems(), []);

  return (
    <EcosTabs
      items={tabs.map(item => {
        return {
          ...item,
          isActive: item.id === currentTab,
          onClick: () => {
            setCurrentTab(item.id);
          }
        };
      })}
      className={'ecos-tabs_mt-10 ecos-tabs_width-full'}
    />
  );
};

export default Tabs;
