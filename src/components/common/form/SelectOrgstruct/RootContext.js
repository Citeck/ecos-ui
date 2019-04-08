import React from 'react';
import PropTypes from 'prop-types';

export const RootContext = React.createContext();

export const RootProvider = props => {
  const { controlProps } = props;

  return (
    <RootContext.Provider
      value={{
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
  controlProps: PropTypes.shape({
    defaultValue: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.string), PropTypes.string]),
    onChange: PropTypes.func,
    onError: PropTypes.func,
    multiple: PropTypes.bool,
    isCompact: PropTypes.bool
  })
};
