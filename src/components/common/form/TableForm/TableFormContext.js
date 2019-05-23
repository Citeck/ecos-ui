import React, { useState } from 'react';
import PropTypes from 'prop-types';

export const TableFormContext = React.createContext();

export const FORM_MODE_CREATE = 0;
export const FORM_MODE_EDIT = 1;

export const TableFormContextProvider = props => {
  const { controlProps } = props;
  const { onChange } = controlProps;

  const [formMode, setFormMode] = useState(FORM_MODE_CREATE);
  const [isModalFormOpen, setIsModalFormOpen] = useState(false);
  const [record, setRecord] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);

  return (
    <TableFormContext.Provider
      value={{
        controlProps: {
          ...controlProps
        },
        error: null,
        formMode,
        record,
        isModalFormOpen,
        selectedRows,

        toggleModal: () => {
          setIsModalFormOpen(!isModalFormOpen);
        },

        showCreateForm: () => {
          setRecord('dict@idocs:contractor'); // TODO
          setFormMode(FORM_MODE_CREATE);
          setIsModalFormOpen(true);
        },

        showEditForm: record => {
          setRecord(record);
          setFormMode(FORM_MODE_EDIT);
          setIsModalFormOpen(true);
        },

        onCreateFormSubmit: (record, form) => {
          console.log('onCreateFormSubmit', record, form);
          setIsModalFormOpen(false);

          const newSelectedRows = [...selectedRows, record];

          setSelectedRows(newSelectedRows);

          // TODO
          typeof onChange === 'function' && onChange(newSelectedRows.map(item => item.id));
        },

        onEditFormSubmit: (record, form) => {
          console.log('onEditFormSubmit', record, form);
          setIsModalFormOpen(false);
        },

        deleteSelectedItem: id => {
          const newSelectedRows = selectedRows.filter(item => item.id !== id);
          setSelectedRows([...newSelectedRows]);

          // TODO
          typeof onChange === 'function' && onChange(newSelectedRows.map(item => item.id));
        }
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
