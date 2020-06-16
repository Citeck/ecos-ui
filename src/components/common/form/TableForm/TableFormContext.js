import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import get from 'lodash/get';
import isBoolean from 'lodash/isBoolean';

import WidgetService from '../../../../services/WidgetService';
import Records from '../../../Records/Records';
import { parseAttribute } from '../../../Records/Record';
import { FORM_MODE_CLONE, FORM_MODE_CREATE, FORM_MODE_EDIT } from '../../../EcosForm';
import TableFormPropTypes from './TableFormPropTypes';

export const TableFormContext = React.createContext();

export const TableFormContextProvider = props => {
  const { controlProps } = props;
  const {
    onChange,
    createVariants,
    columns,
    error,
    defaultValue,
    triggerEventOnTableChange,
    computed,
    onSelectRows,
    selectedRows,
    settingElements
  } = controlProps;

  const [formMode, setFormMode] = useState(FORM_MODE_CREATE);
  const [isViewOnlyForm, setIsViewOnlyForm] = useState(false);
  const [isModalFormOpen, setIsModalFormOpen] = useState(false);
  const [createVariant, setCreateVariant] = useState(null);
  const [record, setRecord] = useState(null);
  const [gridRows, setGridRows] = useState([]);

  const onChangeHandler = rows => {
    typeof onChange === 'function' && onChange(rows.map(item => item.id));
    typeof triggerEventOnTableChange === 'function' && triggerEventOnTableChange();
  };

  const [inlineToolsOffsets, setInlineToolsOffsets] = useState({
    height: 0,
    top: 0,
    rowId: null
  });

  useEffect(() => {
    if (!defaultValue || columns.length < 1) {
      return;
    }

    let initValue;
    if (!Array.isArray(defaultValue)) {
      initValue = [defaultValue];
    } else {
      initValue = [...defaultValue];
    }

    if (initValue) {
      let atts = [];
      columns.forEach(item => {
        const hasBracket = item.attribute.includes('{');
        const hasQChar = item.attribute.includes('?');
        if (hasBracket || hasQChar) {
          atts.push(item.attribute);
          return;
        }
        const multiplePostfix = item.multiple ? 's' : '';
        const schema = `.att${multiplePostfix}(n:"${item.attribute}"){disp}`;
        atts.push(schema);
      });

      Promise.all(
        initValue.map(r => {
          return Records.get(r)
            .load(atts)
            .then(result => {
              const fetchedAtts = {};
              for (let attSchema in result) {
                if (!result.hasOwnProperty(attSchema)) {
                  continue;
                }

                const attData = parseAttribute(attSchema);
                if (!attData) {
                  continue;
                }

                fetchedAtts[attData.name] = result[attSchema];
              }

              return { ...fetchedAtts, id: r };
            });
        })
      ).then(result => {
        setGridRows(result);
        typeof triggerEventOnTableChange === 'function' && triggerEventOnTableChange();
      });
    }
  }, [defaultValue, columns, setGridRows]);

  return (
    <TableFormContext.Provider
      value={{
        controlProps: {
          ...controlProps
        },
        error,
        formMode,
        isViewOnlyForm,
        record,
        createVariant,
        isModalFormOpen,
        gridRows,
        selectedRows,
        columns,
        inlineToolsOffsets,
        createVariants,
        computed,

        toggleModal: () => {
          setIsModalFormOpen(!isModalFormOpen);
        },

        showCreateForm: createVariant => {
          setIsViewOnlyForm(false);
          setRecord(null);
          setCreateVariant(createVariant);
          setFormMode(FORM_MODE_CREATE);
          setIsModalFormOpen(true);
        },

        showEditForm: record => {
          setIsViewOnlyForm(false);
          setRecord(record);
          setCreateVariant(null);
          setFormMode(FORM_MODE_EDIT);
          setIsModalFormOpen(true);
        },

        showViewOnlyForm: record => {
          setIsViewOnlyForm(true);
          setCreateVariant(null);
          setRecord(record);
          setFormMode(FORM_MODE_EDIT);
          setIsModalFormOpen(true);
        },

        showPreview: recordId => {
          WidgetService.openPreviewModal({ recordId });
        },

        runCloneRecord: record => {
          const isInstantClone = isBoolean(get(settingElements, 'isInstantClone')) ? settingElements.isInstantClone : false;

          if (isInstantClone) {
            //todo new impl
          } else {
            //todo change
            setIsViewOnlyForm(false);
            setRecord(record);
            setCreateVariant(null);
            setFormMode(FORM_MODE_CLONE);
            setIsModalFormOpen(true);
          }
        },

        onCreateFormSubmit: (record, form) => {
          setIsModalFormOpen(false);

          const newGridRows = [
            ...gridRows,
            {
              id: record.id,
              ...record.toJson()['attributes']
            }
          ];

          setGridRows(newGridRows);
          onChangeHandler(newGridRows);
        },

        onEditFormSubmit: (record, form) => {
          let editRecordId = record.id;
          let isAlias = editRecordId.indexOf('-alias') !== -1;

          let newGridRows = [...gridRows];

          const newRow = { ...record.toJson()['attributes'], id: editRecordId };

          if (isAlias) {
            // replace base record row by newRow in values list
            const baseRecord = record.getBaseRecord();
            const baseRecordId = baseRecord.id;
            const baseRecordIndex = gridRows.findIndex(item => item.id === baseRecordId);
            if (baseRecordIndex !== -1) {
              newGridRows = [...newGridRows.slice(0, baseRecordIndex), newRow, ...newGridRows.slice(baseRecordIndex + 1)];
            }

            Records.forget(baseRecordId); // reset cache for base record
          }

          // add or update record alias
          const editRecordIndex = newGridRows.findIndex(item => item.id === record.id);
          if (editRecordIndex !== -1) {
            newGridRows = [...newGridRows.slice(0, editRecordIndex), newRow, ...newGridRows.slice(editRecordIndex + 1)];
          } else {
            newGridRows.push(newRow);
          }

          setGridRows(newGridRows);

          onChangeHandler(newGridRows);

          setIsModalFormOpen(false);
        },

        deleteSelectedItem: id => {
          const newGridRows = gridRows.filter(item => item.id !== id);
          setGridRows([...newGridRows]);

          onChangeHandler(newGridRows);
        },

        setInlineToolsOffsets: offsets => {
          if (
            offsets &&
            inlineToolsOffsets &&
            (offsets.height !== inlineToolsOffsets.height ||
              offsets.top !== inlineToolsOffsets.top ||
              offsets.row.id !== inlineToolsOffsets.rowId)
          ) {
            setInlineToolsOffsets({
              height: offsets.height,
              top: offsets.top,
              rowId: offsets.row.id || null
            });
          }
        },

        onSelectGridItem: value => {
          typeof onSelectRows === 'function' && onSelectRows(value.selected);
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
