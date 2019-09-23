import React from 'react';
import PropTypes from 'prop-types';
import SelectOrgstructRoot from './components/SelectOrgstructRoot';
import { SelectOrgstructProvider } from './SelectOrgstructContext';
import { OrgStructApi } from '../../../../api/orgStruct';
import { GROUP_TYPE_BRANCH, GROUP_TYPE_ROLE, AUTHORITY_TYPE_USER, AUTHORITY_TYPE_GROUP } from './constants';
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
  allowedGroupSubTypes: []
};

SelectOrgstruct.propTypes = {
  defaultValue: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.string), PropTypes.string]),
  onChange: PropTypes.func,
  onError: PropTypes.func,
  multiple: PropTypes.bool,
  isCompact: PropTypes.bool,
  allUsersGroup: PropTypes.string,
  allowedAuthorityTypes: PropTypes.array,
  allowedGroupTypes: PropTypes.array,
  allowedGroupSubTypes: PropTypes.array,
  viewOnly: PropTypes.bool
};

export default SelectOrgstruct;
