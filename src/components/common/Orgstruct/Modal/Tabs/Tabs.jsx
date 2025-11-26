import React, { useContext, useMemo } from 'react';

import { default as EcosTabs } from '../../../Tabs';
import { OrgstructContext } from '../../OrgstructContext';
import { TabTypes } from '../../constants';

import { AUTHORITY_TYPE_ROLE } from '@/components/common/form/SelectOrgstruct/constants';
import { t } from '@/helpers/util';

function getTabItems(isAllUsersGroupsExists, hasAuthorityTypeRoles = false) {
  const tabs = [
    {
      id: TabTypes.LEVELS,
      label: t('select-orgstruct.tab.by-levels')
    }
  ];

  if (isAllUsersGroupsExists) {
    tabs.splice(1, 0, {
      id: TabTypes.USERS,
      label: t('select-orgstruct.tab.all-users')
    });
  }

  if (hasAuthorityTypeRoles) {
    tabs.push({
      id: TabTypes.ROLE,
      label: t('select-orgstruct.tab.role')
    });
  }

  return tabs;
}

const Tabs = () => {
  const context = useContext(OrgstructContext);
  const { currentTab, setCurrentTab, isAllUsersGroupsExists, controlProps } = context;
  const { allowedAuthorityTypes = [] } = controlProps || {};

  const tabs = useMemo(
    () => getTabItems(isAllUsersGroupsExists, allowedAuthorityTypes.includes(AUTHORITY_TYPE_ROLE)),
    [isAllUsersGroupsExists]
  );

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
