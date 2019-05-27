import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { JournalsApi } from '../../../../api/journalsApi';

export const TableFormContext = React.createContext();

export const FORM_MODE_CREATE = 0;
export const FORM_MODE_EDIT = 1;

const journalId = 'idocs-contractor'; // TODO
const initRecord = 'dict@idocs:contractor'; // TODO

export const TableFormContextProvider = props => {
  const { controlProps } = props;
  const { onChange } = controlProps;

  const [formMode, setFormMode] = useState(FORM_MODE_CREATE);
  const [isModalFormOpen, setIsModalFormOpen] = useState(false);
  const [record, setRecord] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [columns, setColumns] = useState([]);

  const [inlineToolsOffsets, setInlineToolsOffsets] = useState({
    height: 0,
    top: 0,
    rowId: null
  });

  useEffect(() => {
    const journalsApi = new JournalsApi();

    journalsApi.getJournalConfig(journalId).then(journalConfig => {
      // console.log('journalConfig', journalConfig);

      setColumns(
        journalConfig.columns.map(item => {
          return {
            ...item,
            dataField: item.dataField || item.attribute
          };
        }) || []
      );

      // if (Array.isArray(displayColumns) && displayColumns.length > 0) {
      //   columns = columns.map(item => {
      //     return {
      //       ...item,
      //       default: displayColumns.indexOf(item.attribute) !== -1
      //     };
      //   });
      // }
    });
  }, []);

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
        columns,
        inlineToolsOffsets,

        toggleModal: () => {
          setIsModalFormOpen(!isModalFormOpen);
        },

        showCreateForm: () => {
          setRecord(initRecord);
          setFormMode(FORM_MODE_CREATE);
          setIsModalFormOpen(true);
        },

        showEditForm: record => {
          setRecord(record);
          setFormMode(FORM_MODE_EDIT);
          setIsModalFormOpen(true);
        },

        onCreateFormSubmit: (record, form) => {
          setIsModalFormOpen(false);

          const newSelectedRows = [
            ...selectedRows,
            {
              id: record.id,
              ...record.getAttributesToPersist(true)
            }
          ];

          setSelectedRows(newSelectedRows);

          typeof onChange === 'function' && onChange(newSelectedRows.map(item => item.id));
        },

        onEditFormSubmit: (record, form) => {
          const editRecordId = record.id;
          const editRecordIndex = selectedRows.findIndex(item => item.id === editRecordId);

          const newSelectedRows = [
            ...selectedRows.slice(0, editRecordIndex),
            { id: record.id, ...record.getAttributesToPersist(true) },
            ...selectedRows.slice(editRecordIndex + 1)
          ];

          setSelectedRows(newSelectedRows);
          setIsModalFormOpen(false);
        },

        deleteSelectedItem: id => {
          const newSelectedRows = selectedRows.filter(item => item.id !== id);
          setSelectedRows([...newSelectedRows]);

          typeof onChange === 'function' && onChange(newSelectedRows.map(item => item.id));
        },

        setInlineToolsOffsets: (e, offsets) => {
          if (offsets.height !== inlineToolsOffsets.height || offsets.top !== inlineToolsOffsets.top) {
            setInlineToolsOffsets({
              height: offsets.height,
              top: offsets.top,
              rowId: offsets.row.id || null
            });
          }
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
