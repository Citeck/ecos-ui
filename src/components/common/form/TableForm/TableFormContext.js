import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import get from 'lodash/get';
import isBoolean from 'lodash/isBoolean';
import cloneDeep from 'lodash/cloneDeep';

import WidgetService from '../../../../services/WidgetService';
import Records from '../../../Records/Records';
import Record from '../../../Records/Record';
import { parseAttribute } from '../../../Records/utils/attStrUtils';
import { FORM_MODE_CLONE, FORM_MODE_CREATE, FORM_MODE_EDIT, FORM_MODE_VIEW } from '../../../EcosForm/constants';
import EcosFormUtils from '../../../EcosForm/EcosFormUtils';
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
  const [clonedRecord, setClonedRecord] = useState(null);
  const [gridRows, setGridRows] = useState([]);
  const [inlineToolsOffsets, setInlineToolsOffsets] = useState({
    height: 0,
    top: 0,
    rowId: null
  });

  const isInstantClone = isBoolean(get(settingElements, 'isInstantClone')) ? settingElements.isInstantClone : false;

  const onChangeHandler = rows => {
    typeof onChange === 'function' && onChange(rows.map(item => item.id));
    typeof triggerEventOnTableChange === 'function' && triggerEventOnTableChange();
  };

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
      const atts = [];
      const noNeedParseIndices = [];
      columns.forEach((item, idx) => {
        const isFullName = item.attribute.startsWith('.att');
        const hasBracket = item.attribute.includes('{');
        const hasQChar = item.attribute.includes('?');
        if (isFullName || hasBracket || hasQChar) {
          atts.push(item.attribute);
          noNeedParseIndices.push(idx);
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
              let currentAttIndex = 0;
              for (let attSchema in result) {
                if (!result.hasOwnProperty(attSchema)) {
                  continue;
                }

                if (noNeedParseIndices.includes(currentAttIndex)) {
                  fetchedAtts[attSchema] = result[attSchema];
                } else {
                  const attData = parseAttribute(attSchema);
                  if (!attData) {
                    currentAttIndex++;
                    continue;
                  }

                  fetchedAtts[attData.name] = result[attSchema];
                }
                currentAttIndex++;
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

  useEffect(() => {
    if (clonedRecord) {
      Records.get(clonedRecord)
        .load('_formKey?str')
        .then(formKey => {
          const createVariant = createVariants.find(item => (item.formKey || `alf_${item.type}`) === formKey);

          if (isInstantClone) {
            return EcosFormUtils.cloneRecord({ clonedRecord, createVariant, saveOnSubmit: false });
          } else {
            showCloneForm({ createVariant });
          }
        })
        .then(record => {
          if (record instanceof Record) {
            onCreateFormSubmit(record);
          }
        });
    }
  }, [clonedRecord]);

  const showCloneForm = ({ createVariant }) => {
    setIsViewOnlyForm(false);
    setRecord(null);
    setCreateVariant(createVariant);
    setFormMode(FORM_MODE_CLONE);
    setIsModalFormOpen(true);
  };

  const onCreateFormSubmit = record => {
    setIsModalFormOpen(false);
    setClonedRecord(null);

    record.toJsonAsync().then(res => {
      const attributes = cloneDeep(res.attributes);
      const restAttrs = Object.keys(attributes);

      const unresolvedCols = columns.filter(item => {
        if (item.attribute in res.attributes) {
          const index = restAttrs.findIndex(value => value === item.attribute);
          restAttrs.splice(index, 1);
          return false;
        }

        return true;
      });

      unresolvedCols.forEach(col => {
        const similarAttr = restAttrs.find(att => col.attribute.includes(att));

        if (similarAttr) {
          attributes[col.attribute] = attributes[similarAttr];
        }
      });

      const newGridRows = [
        ...gridRows,
        {
          id: record.id,
          ...attributes
        }
      ];

      setGridRows(newGridRows);
      onChangeHandler(newGridRows);
    });
  };

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
        clonedRecord,
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
          setClonedRecord(null);
        },

        showCreateForm: createVariant => {
          setIsViewOnlyForm(false);
          setRecord(null);
          setClonedRecord(null);
          setCreateVariant(createVariant);
          setFormMode(FORM_MODE_CREATE);
          setIsModalFormOpen(true);
        },

        showEditForm: record => {
          setIsViewOnlyForm(false);
          setRecord(record);
          setClonedRecord(null);
          setCreateVariant(null);
          setFormMode(FORM_MODE_EDIT);
          setIsModalFormOpen(true);
        },

        runCloneRecord: record => {
          setClonedRecord(record);
        },

        showViewOnlyForm: record => {
          setIsViewOnlyForm(true);
          setCreateVariant(null);
          setRecord(record);
          setFormMode(FORM_MODE_VIEW);
          setIsModalFormOpen(true);
        },

        showPreview: recordId => {
          WidgetService.openPreviewModal({ recordId });
        },

        onCreateFormSubmit,

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
