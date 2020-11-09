import React from 'react';
import PropTypes from 'prop-types';

import SelectOrgstructRoot from './components/SelectOrgstructRoot';
import { SelectOrgstructProvider } from './SelectOrgstructContext';
import { OrgStructApi } from '../../../../api/orgStruct';
import {
  AUTHORITY_TYPE_GROUP,
  AUTHORITY_TYPE_USER,
  GROUP_TYPE_BRANCH,
  GROUP_TYPE_ROLE,
  TAB_ALL_USERS,
  TAB_BY_LEVELS,
  TAB_ONLY_SELECTED,
  VIEW_MODE_TYPE_DEFAULT,
  VIEW_MODE_TYPE_LINE_SEPARATED
} from './constants';

import './SelectOrgstruct.scss';

const orgStructApi = new OrgStructApi();

const SelectOrgstruct = props => {
  return (
    <SelectOrgstructProvider controlProps={props} orgStructApi={orgStructApi}>
      <SelectOrgstructRoot />
    </SelectOrgstructProvider>
  );
};

SelectOrgstruct.defaultProps = {
  allowedAuthorityTypes: [AUTHORITY_TYPE_GROUP, AUTHORITY_TYPE_USER],
  allowedGroupTypes: [GROUP_TYPE_BRANCH, GROUP_TYPE_ROLE],
  allowedGroupSubTypes: [],
  defaultTab: TAB_BY_LEVELS,
  userSearchExtraFields: [],
  viewModeType: VIEW_MODE_TYPE_DEFAULT
};

SelectOrgstruct.propTypes = {
  defaultValue: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.string), PropTypes.string]),
  defaultTab: PropTypes.oneOf([TAB_BY_LEVELS, TAB_ALL_USERS, TAB_ONLY_SELECTED]),
  onChange: PropTypes.func,
  onCancelSelect: PropTypes.func,
  onError: PropTypes.func,
  renderView: PropTypes.func,
  renderListItem: PropTypes.func,
  multiple: PropTypes.bool,
  isCompact: PropTypes.bool,
  viewModeType: PropTypes.oneOf([VIEW_MODE_TYPE_DEFAULT, VIEW_MODE_TYPE_LINE_SEPARATED]),
  hideTabSwitcher: PropTypes.bool,
  hideInputView: PropTypes.bool,
  getFullData: PropTypes.bool, // return full data about selected user, not only nodeRef
  viewOnly: PropTypes.bool,
  isSelectedValueAsText: PropTypes.bool,
  openByDefault: PropTypes.bool,
  modalTitle: PropTypes.string,
  allowedAuthorityTypes: PropTypes.array,
  allowedGroupTypes: PropTypes.array,
  allowedGroupSubTypes: PropTypes.array,
  excludeAuthoritiesByName: PropTypes.string,
  excludeAuthoritiesByType: PropTypes.array,
  liveSearch: PropTypes.bool, // search by key down
  userSearchExtraFields: PropTypes.array,
  isIncludedAdminGroup: PropTypes.bool
};

export default SelectOrgstruct;
