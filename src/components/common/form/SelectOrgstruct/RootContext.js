import React from 'react';
import PropTypes from 'prop-types';
import { OrgStructApi } from '../../../../api/orgStruct';

export const RootContext = React.createContext();

export const RootProvider = props => {
  const { controlProps, orgStructApi } = props;

  return (
    <RootContext.Provider
      value={{
        orgStructApi,
        controlProps: {
          ...controlProps
        },
        value: controlProps.multiple ? [] : null,
        selectedRows: [],
        error: null
      }}
    >
      {props.children}
    </RootContext.Provider>
  );
};

RootProvider.displayName = 'SelectOrgstruct.RootProvider';

RootProvider.propTypes = {
  orgStructApi: PropTypes.instanceOf(OrgStructApi),
  controlProps: PropTypes.shape({
    defaultValue: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.string), PropTypes.string]),
    onChange: PropTypes.func,
    onError: PropTypes.func,
    multiple: PropTypes.bool,
    isCompact: PropTypes.bool
  })
};
