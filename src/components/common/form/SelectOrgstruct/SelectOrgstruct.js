import PropTypes from 'prop-types';
import React from 'react';

import { SelectOrgstructProvider } from './SelectOrgstructContext';
import SelectOrgstructRoot from './components/SelectOrgstructRoot';
import { AUTHORITY_TYPE_GROUP, AUTHORITY_TYPE_USER, DataTypes, GroupTypes, ROOT_GROUP_NAME, TabTypes, ViewModes } from './constants';
import { OrgStructApi } from '../../../../api/orgStruct';
import { IS_TEST_ENV } from '../../../../helpers/util';

import './SelectOrgstruct.scss';

const orgStructApi = new OrgStructApi();

const SelectOrgstruct = props => {
  if (IS_TEST_ENV) {
    return <div />;
  }

  return (
    <SelectOrgstructProvider controlProps={props} orgStructApi={orgStructApi}>
      <SelectOrgstructRoot />
    </SelectOrgstructProvider>
  );
};

SelectOrgstruct.defaultProps = {
  allowedAuthorityTypes: [AUTHORITY_TYPE_GROUP, AUTHORITY_TYPE_USER],
  allowedGroupTypes: [GroupTypes.BRANCH, GroupTypes.ROLE],
  rootGroupName: ROOT_GROUP_NAME,
  customRootGroupName: '',
  allowedGroupSubTypes: [],
  defaultTab: TabTypes.LEVELS,
  dataType: DataTypes.NODE_REF,
  userSearchExtraFields: [],
  viewModeType: ViewModes.DEFAULT
};

SelectOrgstruct.propTypes = {
  defaultValue: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.string), PropTypes.string]),
  defaultTab: PropTypes.oneOf(Object.values(TabTypes)),
  dataType: PropTypes.oneOf(Object.values(DataTypes)),
  onChange: PropTypes.func,
  onCancelSelect: PropTypes.func,
  onError: PropTypes.func,
  renderView: PropTypes.func,
  renderListItem: PropTypes.func,
  multiple: PropTypes.bool,
  isCompact: PropTypes.bool,
  viewModeType: PropTypes.oneOf(Object.values(ViewModes)),
  hideTabSwitcher: PropTypes.bool,
  hideInputView: PropTypes.bool,
  getFullData: PropTypes.bool, // return full data about selected user, not only nodeRef
  viewOnly: PropTypes.bool,
  isSelectedValueAsText: PropTypes.bool,
  openByDefault: PropTypes.bool,
  modalTitle: PropTypes.string,
  allowedAuthorityTypes: PropTypes.array,
  allowedGroupTypes: PropTypes.arrayOf(PropTypes.oneOf(Object.values(GroupTypes))),
  rootGroupName: PropTypes.string,
  allowedGroupSubTypes: PropTypes.array,
  excludeAuthoritiesByName: PropTypes.string,
  excludeAuthoritiesByType: PropTypes.array,
  liveSearch: PropTypes.bool, // search by key down
  userSearchExtraFields: PropTypes.array,
  isIncludedAdminGroup: PropTypes.bool,
  isLoading: PropTypes.bool
};

export default SelectOrgstruct;
