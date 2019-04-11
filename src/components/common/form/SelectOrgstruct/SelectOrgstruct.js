import React from 'react';
import PropTypes from 'prop-types';
import SelectOrgstructRoot from './components/SelectOrgstructRoot';
import { SelectOrgstructProvider } from './SelectOrgstructContext';
import { OrgStructApi } from '../../../../api/orgStruct';
import './SelectOrgstruct.scss';

const orgStructApi = new OrgStructApi();

const SelectOrgstruct = props => {
  return (
    <SelectOrgstructProvider controlProps={props} orgStructApi={orgStructApi}>
      <SelectOrgstructRoot />
    </SelectOrgstructProvider>
  );
};

SelectOrgstruct.propTypes = {
  defaultValue: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.string), PropTypes.string]),
  onChange: PropTypes.func,
  onError: PropTypes.func,
  multiple: PropTypes.bool,
  isCompact: PropTypes.bool
};

export default SelectOrgstruct;
