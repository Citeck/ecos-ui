import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import get from 'lodash/get';
import isString from 'lodash/isString';
import isBoolean from 'lodash/isBoolean';
import cloneDeep from 'lodash/cloneDeep';
import isEmpty from 'lodash/isEmpty';
import isFunction from 'lodash/isFunction';

import WidgetService from '../../../../services/WidgetService';
import Records from '../../../Records/Records';
import Record from '../../../Records/Record';
import { parseAttribute } from '../../../Records/utils/attStrUtils';
import { FORM_MODE_CLONE, FORM_MODE_CREATE, FORM_MODE_EDIT, FORM_MODE_VIEW } from '../../../EcosForm';
import EcosFormUtils from '../../../EcosForm/EcosFormUtils';
import TableFormPropTypes from './TableFormPropTypes';
import { LOCAL_ID } from '../../../../constants/journal';

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
  const [rowPosition, setRowPosition] = useState(0);
  const [inlineToolsOffsets, setInlineToolsOffsets] = useState({
    height: 0,
    top: 0,
    rowId: null
  });

  const isInstantClone = isBoolean(get(settingElements, 'isInstantClone')) ? settingElements.isInstantClone : false;

  const onChangeHandler = rows => {
    isFunction(onChange) && onChange(rows.map(item => item.id));
    isFunction(triggerEventOnTableChange) && triggerEventOnTableChange();
  };

  useEffect(() => {
    if (isEmpty(defaultValue) || isEmpty(columns)) {
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
      const attsAsIs = [];
      const noNeedParseIndices = [];

      columns.forEach((item, idx) => {
        const { attribute = '', multiple = false } = item || {};
        const isFullName = attribute.startsWith('.att');
        const hasBracket = attribute.includes('{');
        const hasQChar = attribute.includes('?');

        if (isFullName || hasBracket || hasQChar) {
          atts.push(attribute);
          noNeedParseIndices.push(idx);
          return;
        }

        const multiplePostfix = multiple ? 's' : '';
        const schema = `.att${multiplePostfix}(n:"${attribute}"){disp}`;

        atts.push(schema);
        attsAsIs.push(attribute);
      });
      Promise.all(
        initValue.map(async rec => {
          const record = Records.get(rec);
          const fetchedAtts = {};
          let result = {};
          let currentAttIndex = 0;

          if (record.isBaseRecord()) {
            result = await record.load(atts);
          } else {
            result = await record.toJsonAsync(true).then(result => get(result, 'attributes') || {});
            const nonExistAttrs = attsAsIs.filter(item => !Object.keys(result).includes(item));

            if (!isEmpty(nonExistAttrs)) {
              const more = await record.load(nonExistAttrs);
              result = { ...result, ...more };
            }
          }

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

          return { ...fetchedAtts, id: rec, [LOCAL_ID]: rec };
        })
      )
        .then(result => {
          setGridRows(result);
          isFunction(triggerEventOnTableChange) && triggerEventOnTableChange();
        })
        .catch(e => {
          console.error(e);
          setGridRows([]);
        });
    }
  }, [defaultValue, columns]);

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
        .then(record => record instanceof Record && onCreateFormSubmit(record));
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

    record.toJsonAsync(true).then(async res => {
      const attributes = cloneDeep(res.attributes);
      const restAttrs = Object.keys(attributes);

      for (let column of columns) {
        if (column.attribute in attributes) {
          const index = restAttrs.findIndex(value => value === column.attribute);
          const displayName = await Records.get(res.attributes[column.attribute]).load('.disp');
          restAttrs.splice(index, 1);
          if (displayName) {
            attributes[column.attribute] = displayName;
          }
        }
      }
      const unresolvedCols = columns.filter(item => !(item.attribute in res.attributes));

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
          [LOCAL_ID]: record.id,
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
        rowPosition,

        toggleModal: () => {
          setIsModalFormOpen(!isModalFormOpen);
          setClonedRecord(null);
        },

        //todo: should use action service for inline buttons
        showCreateForm: createVariant => {
          setIsViewOnlyForm(false);
          setRecord(null);
          setClonedRecord(null);
          setCreateVariant(createVariant);
          setFormMode(FORM_MODE_CREATE);
          setIsModalFormOpen(true);
          setRowPosition(rowPosition);
          setRowPosition(null);
        },

        showEditForm: (record, rowPosition = null) => {
          setIsViewOnlyForm(false);
          setRecord(record);
          setClonedRecord(null);
          setCreateVariant(null);
          setFormMode(FORM_MODE_EDIT);
          setIsModalFormOpen(true);
          setRowPosition(rowPosition);
        },

        runCloneRecord: record => {
          setClonedRecord(record);
        },

        showViewOnlyForm: (record, rowPosition = null) => {
          setIsViewOnlyForm(true);
          setCreateVariant(null);
          setRecord(record);
          setFormMode(FORM_MODE_VIEW);
          setIsModalFormOpen(true);
          setRowPosition(rowPosition);
        },

        showPreview: (recordId, rowPosition = null) => {
          WidgetService.openPreviewModal({ recordId });
          setRowPosition(rowPosition);
        },

        onCreateFormSubmit,

        onEditFormSubmit: record => {
          let editRecordId = record.id;
          let isAlias = editRecordId.indexOf('-alias') !== -1;
          let newGridRows = [...gridRows];

          const createNewRow = async (initialRow, originColumn, editedRecord, attributes) => {
            const attrs = Object.keys(originColumn);
            const recordWithOriginalColumnKeys = await editedRecord.load(attrs);
            let newRow = { ...initialRow, ...recordWithOriginalColumnKeys };
            const attrsWithoutScalar = attrs.filter(att => att.indexOf('?') === -1);
            for (const att of attrsWithoutScalar) {
              const attr = attributes[att];
              if (isString(attr) && (attr.includes('@') || attr.includes('workspace://SpacesStore/'))) {
                const displayName = await Records.get(attr).load('.disp');
                newRow = displayName ? { ...newRow, [att]: displayName } : { ...newRow };
              }
            }

            return newRow;
          };

          record.toJsonAsync(true).then(async res => {
            let newRow = { ...res['attributes'], id: editRecordId, [LOCAL_ID]: editRecordId };

            if (isAlias) {
              // replace base record row by newRow in values list
              const baseRecord = record.getBaseRecord();
              const baseRecordId = baseRecord.id;
              const baseRecordIndex = gridRows.findIndex(item => item.id === baseRecordId);
              if (baseRecordIndex !== -1) {
                newRow = await createNewRow(newRow, newGridRows[baseRecordIndex], record, res['attributes']);
                newRow = { ...newRow, id: editRecordId, [LOCAL_ID]: editRecordId };
                newGridRows = [...newGridRows.slice(0, baseRecordIndex), newRow, ...newGridRows.slice(baseRecordIndex + 1)];
              }

              Records.forget(baseRecordId); // reset cache for base record
            }

            // add or update record alias
            const editRecordIndex = newGridRows.findIndex(item => item.id === record.id);
            if (editRecordIndex !== -1) {
              newRow = await createNewRow(newRow, newGridRows[editRecordIndex], record, res['attributes']);
              newRow = { ...newRow, id: editRecordId, [LOCAL_ID]: editRecordId };
              newGridRows = [...newGridRows.slice(0, editRecordIndex), newRow, ...newGridRows.slice(editRecordIndex + 1)];
            } else {
              newGridRows.push(newRow);
            }

            setGridRows(newGridRows);
            onChangeHandler(newGridRows);
            setIsModalFormOpen(false);
          });
        },

        deleteSelectedItem: id => {
          const newGridRows = gridRows.filter(item => item.id !== id);
          setGridRows([...newGridRows]);
          setRowPosition(null);

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
              rowId: offsets.row.id || null,
              position: offsets.position || 0
            });
          }
        },

        onSelectGridItem: value => isFunction(onSelectRows) && onSelectRows(value.selected)
      }}
    >
      {props.children}
    </TableFormContext.Provider>
  );
};

TableFormContextProvider.propTypes = {
  controlProps: PropTypes.shape(TableFormPropTypes)
};
