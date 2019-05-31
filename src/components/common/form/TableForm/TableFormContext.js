import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import TableFormPropTypes from './TableFormPropTypes';
import { JournalsApi } from '../../../../api/journalsApi';
import Records from '../../../Records/Records';
import EcosFormUtils from '../../../EcosForm/EcosFormUtils';
import GqlDataSource from '../../../../components/common/grid/dataSource/GqlDataSource';

export const TableFormContext = React.createContext();

export const FORM_MODE_CREATE = 0;
export const FORM_MODE_EDIT = 1;

export const TableFormContextProvider = props => {
  const { controlProps } = props;
  const { onChange, onError, source } = controlProps;

  const [formMode, setFormMode] = useState(FORM_MODE_CREATE);
  const [isModalFormOpen, setIsModalFormOpen] = useState(false);
  const [record, setRecord] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [columns, setColumns] = useState([]);
  const [createVariants, setCreateVariants] = useState([]);
  const [error, setError] = useState(null);

  const [inlineToolsOffsets, setInlineToolsOffsets] = useState({
    height: 0,
    top: 0,
    rowId: null
  });

  useEffect(() => {
    if (!source) {
      return;
    }

    const { type } = source;

    if (type === 'journal') {
      const { journal } = source;
      const journalId = journal.journalId;

      if (!journalId) {
        const err = new Error('The "journalId" config is required!');
        typeof onError === 'function' && onError(err);
        setError(err);
        return;
      }

      const journalsApi = new JournalsApi();
      const displayColumns = journal.columns;

      journalsApi.getJournalConfig(journalId).then(journalConfig => {
        // console.log('journalConfig', journalConfig);
        setCreateVariants(journalConfig.meta.createVariants || []);

        let columns = journalConfig.columns;
        if (Array.isArray(displayColumns) && displayColumns.length > 0) {
          columns = columns.map(item => {
            return {
              ...item,
              default: displayColumns.indexOf(item.attribute) !== -1
            };
          });
        }

        setColumns(GqlDataSource.getColumnsStatic(columns));
      });
    } else if (type === 'custom') {
      const { custom } = source;
      const { createVariants, columns } = custom;

      let createVariantsPromise;
      if (!Array.isArray(createVariants) || createVariants.length < 1) {
        createVariantsPromise = EcosFormUtils.getCreateVariants(custom.record, custom.attribute)
          .then(r =>
            r.map(item => {
              return {
                type: item.recordRef,
                title: item.label
              };
            })
          )
          .then(items => {
            setCreateVariants(items);
            return items;
          });
      } else {
        createVariantsPromise = Promise.all(createVariants.map(r => Records.get(r).load('.disp'))).then(dispNames => {
          let result = [];
          for (let i = 0; i < createVariants.length; i++) {
            result.push({
              type: createVariants[i],
              title: dispNames[i] || createVariants[i]
            });
          }
          setCreateVariants(result);
          return result;
        });
      }

      createVariantsPromise.then(cv => {
        if (cv.length < 1 || columns.length < 1) {
          return;
        }

        let atts = {};
        columns.forEach(item => {
          atts[`.edge(n:"${item}"){title,type}`] = item;
        });

        Records.get(cv[0].type)
          .load(Object.keys(atts))
          .then(loadedAtt => {
            let cols = [];
            for (let i in atts) {
              if (!atts.hasOwnProperty(i)) {
                continue;
              }
              cols.push({
                default: true,
                type: loadedAtt[i].type,
                text: loadedAtt[i].title,
                attribute: atts[i]
              });
            }

            setColumns(GqlDataSource.getColumnsStatic(cols));
          });
      });
    }
  }, []);

  return (
    <TableFormContext.Provider
      value={{
        controlProps: {
          ...controlProps
        },
        error,
        formMode,
        record,
        isModalFormOpen,
        selectedRows,
        columns,
        inlineToolsOffsets,
        createVariants,

        toggleModal: () => {
          setIsModalFormOpen(!isModalFormOpen);
        },

        showCreateForm: record => {
          setRecord(record);
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
  controlProps: PropTypes.shape(TableFormPropTypes)
};
