import React from 'react';

import TableFormPropTypes from './TableFormPropTypes';
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

TableForm.propTypes = TableFormPropTypes;

export default TableForm;
