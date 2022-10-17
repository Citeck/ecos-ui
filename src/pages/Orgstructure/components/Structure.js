import React, { useState } from 'react';

import { OrgStructApi } from '../../../api/orgStruct';
import {
  AUTHORITY_TYPE_GROUP,
  AUTHORITY_TYPE_USER,
  DataTypes,
  GroupTypes,
  ROOT_GROUP_NAME,
  TabTypes
} from '../../../components/common/form/SelectOrgstruct/constants';
import { SelectOrgstructProvider } from '../../../components/common/form/SelectOrgstruct/SelectOrgstructContext';
import { t } from '../../../helpers/util';
import OrgstructBody from './OrgstructBody';
import OrgstructureSearch from './OrgstructureSearch';

import './style.scss';

const api = new OrgStructApi();

const Labels = {
  TITLE: 'orgstructure-page-title'
};

const controlProps = {
  label: 'SelectOrgstruct',
  key: 'selectOrgstruct',
  type: 'selectOrgstruct',
  allowedAuthorityTypes: [AUTHORITY_TYPE_USER, AUTHORITY_TYPE_GROUP].join(', '),
  allowedGroupTypes: [GroupTypes.ROLE, GroupTypes.BRANCH].join(', '),
  rootGroupName: ROOT_GROUP_NAME,
  allowedGroupSubTypes: [],
  currentUserByDefault: false,
  excludeAuthoritiesByName: '',
  excludeAuthoritiesByType: [],
  modalTitle: null,
  isSelectedValueAsText: false,
  hideTabSwitcher: false,
  defaultTab: TabTypes.LEVELS,
  dataType: DataTypes.NODE_REF,
  userSearchExtraFields: '',
  isIncludedAdminGroup: false,
  onError: console.error,
  onChange: () => {},
  multiple: false
};

const Structure = () => {
  const [load, setReload] = useState(false);

  const reload = () => {
    setReload(!load);
  };

  return (
    <SelectOrgstructProvider orgStructApi={api} controlProps={controlProps}>
      <div className="orgstructure-page__structure__header">{t(Labels.TITLE)}</div>
      <OrgstructureSearch />
      <OrgstructBody reloadList={reload} />
    </SelectOrgstructProvider>
  );
};

export default Structure;
