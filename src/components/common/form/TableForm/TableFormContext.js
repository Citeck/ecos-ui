import React from 'react';
import PropTypes from 'prop-types';

export const TableFormContext = React.createContext();

export const TableFormContextProvider = props => {
  const { controlProps } = props;

  return (
    <TableFormContext.Provider
      value={{
        controlProps: {
          ...controlProps
        },
        error: null
      }}
    >
      {props.children}
    </TableFormContext.Provider>
  );
};

TableFormContextProvider.propTypes = {
  controlProps: PropTypes.shape({
    defaultValue: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.string), PropTypes.string]),
    onChange: PropTypes.func,
    onError: PropTypes.func,
    isCompact: PropTypes.bool,
    viewOnly: PropTypes.bool
  })
};
