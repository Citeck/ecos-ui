import React from 'react';
import PropTypes from 'prop-types';
import TableFormRoot from './components/TableFormRoot';
import { TableFormContextProvider } from './TableFormContext';
import './TableForm.scss';

const TableForm = props => {
  return (
    <TableFormContextProvider controlProps={props}>
      <TableFormRoot />
    </TableFormContextProvider>
  );
};

TableForm.defaultProps = {};

TableForm.propTypes = {
  defaultValue: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.string), PropTypes.string]),
  onChange: PropTypes.func,
  onError: PropTypes.func,
  isCompact: PropTypes.bool,
  viewOnly: PropTypes.bool
};

export default TableForm;
