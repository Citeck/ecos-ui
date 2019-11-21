import React from 'react';
import PropTypes from 'prop-types';
import SelectOrgstructRoot from './components/SelectOrgstructRoot';
import { SelectOrgstructProvider } from './SelectOrgstructContext';
import { OrgStructApi } from '../../../../api/orgStruct';
import {
  GROUP_TYPE_BRANCH,
  GROUP_TYPE_ROLE,
  AUTHORITY_TYPE_USER,
  AUTHORITY_TYPE_GROUP,
  TAB_BY_LEVELS,
  TAB_ALL_USERS,
  TAB_ONLY_SELECTED
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
  searchFields: []
};

SelectOrgstruct.propTypes = {
  defaultValue: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.string), PropTypes.string]),
  onChange: PropTypes.func,
  onCancelSelect: PropTypes.func,
  onError: PropTypes.func,
  multiple: PropTypes.bool,
  isCompact: PropTypes.bool,
  allUsersGroup: PropTypes.string,
  allowedAuthorityTypes: PropTypes.array,
  allowedGroupTypes: PropTypes.array,
  allowedGroupSubTypes: PropTypes.array,
  excludeAuthoritiesByName: PropTypes.string,
  excludeAuthoritiesByType: PropTypes.array,
  viewOnly: PropTypes.bool,
  openByDefault: PropTypes.bool,
  getFullData: PropTypes.bool, // return full data about selected user, not only nodeRef
  liveSearch: PropTypes.bool, // search by key down
  searchFields: PropTypes.array, // array fields for searching (['label', 'attributes.fullName'])
  hideTabSwitcher: PropTypes.bool,
  renderView: PropTypes.func,
  renderListItem: PropTypes.func,
  hideInputView: PropTypes.bool,
  defaultTab: PropTypes.oneOf([TAB_BY_LEVELS, TAB_ALL_USERS, TAB_ONLY_SELECTED]),
  modalTitle: PropTypes.string
};

export default SelectOrgstruct;
