import React, { useContext, useMemo } from 'react';
import { default as EcosTabs } from '../../../../../Tabs';
import { SelectOrgstructContext } from '../../../SelectOrgstructContext';
import { t } from '../../../../../../../helpers/util';
import { TabTypes } from '../../../constants';

function getTabItems(isAllUsersGroupsExists) {
  const tabs = [
    {
      id: TabTypes.LEVELS,
      label: t('select-orgstruct.tab.by-levels')
    },
    {
      id: TabTypes.SELECTED,
      label: t('select-orgstruct.tab.only-selected')
    }
  ];

  if (isAllUsersGroupsExists) {
    tabs.splice(1, 0, {
      id: TabTypes.USERS,
      label: t('select-orgstruct.tab.all-users')
    });
  }

  return tabs;
}

const Tabs = () => {
  const context = useContext(SelectOrgstructContext);
  const { currentTab, setCurrentTab, isAllUsersGroupsExists } = context;

  const tabs = useMemo(() => getTabItems(isAllUsersGroupsExists), [isAllUsersGroupsExists]);

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
      className="ecos-tabs_mt-10 ecos-tabs_width-full"
    />
  );
};

export default Tabs;
