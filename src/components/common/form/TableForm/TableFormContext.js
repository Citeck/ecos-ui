import cloneDeep from 'lodash/cloneDeep';
import get from 'lodash/get';
import isBoolean from 'lodash/isBoolean';
import isEmpty from 'lodash/isEmpty';
import isFunction from 'lodash/isFunction';
import isObject from 'lodash/isObject';
import isString from 'lodash/isString';
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';

import { LOCAL_ID } from '../../../../constants/journal';
import { getMLValue } from '../../../../helpers/util';
import WidgetService from '../../../../services/WidgetService';
import { FORM_MODE_CLONE, FORM_MODE_CREATE, FORM_MODE_EDIT, FORM_MODE_VIEW } from '../../../EcosForm';
import EcosFormUtils from '../../../EcosForm/EcosFormUtils';
import Record from '../../../Records/Record';
import Records from '../../../Records/Records';
import { parseAttribute } from '../../../Records/utils/attStrUtils';

import TableFormPropTypes from './TableFormPropTypes';
import { getAllComponents } from './utils';

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
    settingElements,
    forceReload
  } = controlProps;

  const [formMode, setFormMode] = useState(FORM_MODE_CREATE);
  const [isViewOnlyForm, setIsViewOnlyForm] = useState(false);
  const [isModalFormOpen, setIsModalFormOpen] = useState(false);
  const [createVariant, setCreateVariant] = useState(null);
  const [record, setRecord] = useState(null);
  const [clonedRecord, setClonedRecord] = useState(null);
  const [gridRows, setGridRows] = useState([]);
  const [rowPosition, setRowPosition] = useState(0);

  const isInstantClone = isBoolean(get(settingElements, 'isInstantClone')) ? settingElements.isInstantClone : false;

  const onChangeHandler = rows => {
    isFunction(onChange) && onChange(rows.map(item => item.id));
    isFunction(triggerEventOnTableChange) && triggerEventOnTableChange();
  };

  useEffect(() => {
    if (isEmpty(columns)) {
      return;
    }

    let initValue;
    if (!Array.isArray(defaultValue)) {
      initValue = [defaultValue];
    } else {
      initValue = [...defaultValue];
    }

    if (typeof initValue[0] === 'string') {
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
          const record = await Records.get(rec);
          const form = await EcosFormUtils.getForm(rec);

          let allComponents = [];

          if (isFunction(form.load)) {
            const definition = await form.load('definition?json');
            allComponents = getAllComponents(definition.components);
          }

          const fetchedAtts = {};
          let result = {};
          let currentAttIndex = 0;

          if (record.isBaseRecord()) {
            result = await record.load(atts, forceReload);
          } else {
            result = await record.toJsonAsync(true).then(result => get(result, 'attributes') || {});
            const nonExistAttrs = attsAsIs.filter(item => !Object.keys(result).includes(item));

            if (!isEmpty(nonExistAttrs)) {
              const more = await record.load(nonExistAttrs, forceReload);
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

              const component = allComponents.find(component => component.key === attData.name && component.type === 'ecosSelect');

              if (component) {
                const option = get(component, 'data.values', []).find(item => item.value === result[attSchema]);

                if (option) {
                  fetchedAtts[attData.name] = isObject(option.label) ? getMLValue(option.label) : option.label;
                  continue;
                }
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
  }, [defaultValue, columns, forceReload]);

  useEffect(() => {
    if (clonedRecord) {
      Records.get(clonedRecord)
        .load('_formKey?str')
        .then(formKey => {
          const matchingVariant = createVariants.find(item => (item.formKey || `alf_${item.type}`) === formKey);
          const createVariant = matchingVariant || createVariants[0];

          if (isInstantClone) {
            return EcosFormUtils.cloneRecord({ clonedRecord, createVariant, saveOnSubmit: false });
          } else {
            showCloneForm({ createVariant, clonedRecord });
            return null;
          }
        })
        .then(record => {
          if (record instanceof Record) {
            onCreateFormSubmit(record);
          }
        })
        .catch(error => {
          console.error('Error handling cloned record:', error);
        });
    }
  }, [clonedRecord]);

  const showCloneForm = ({ createVariant, clonedRecord }) => {
    setIsViewOnlyForm(false);

    const newRecordRef = createVariant.sourceId + '@';
    setRecord(newRecordRef);
    setClonedRecord(clonedRecord);

    setCreateVariant(createVariant);
    setFormMode(FORM_MODE_CLONE);
    setIsModalFormOpen(true);
    return Promise.resolve(null);
  };

  const onCreateFormSubmit = (record, form) => {
    setIsModalFormOpen(false);
    setClonedRecord(null);

    let allComponents = [];
    if (form) {
      allComponents = form.getAllComponents();
    }

    record.toJsonAsync(true).then(async res => {
      const attributes = cloneDeep(res.attributes);
      const restAttrs = Object.keys(attributes);

      for (let column of columns) {
        if (column.attribute in attributes) {
          const index = restAttrs.findIndex(value => value === column.attribute);
          let displayName = null;
          const component = allComponents.find(component => component.key === column.attribute && component.type === 'ecosSelect');

          displayName = await Records.get(res.attributes[column.attribute]).load('.disp');

          if (component && !displayName) {
            const attValue = attributes[column.attribute];
            if (attValue) {
              const option = get(component, 'currentItems', []).find(item => item.value === attValue);
              if (option) {
                displayName = isObject(option.label) ? getMLValue(option.label) : option.label;
              }
            }
          }

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

        onEditFormSubmit: (record, form) => {
          let editRecordId = record.id;
          let isAlias = editRecordId.indexOf('-alias') !== -1;
          let newGridRows = [...gridRows];

          let allComponents = [];
          if (form) {
            allComponents = form.getAllComponents();
          }

          const createNewRow = async (initialRow, originColumn, editedRecord, attributes) => {
            const attrs = Object.keys(originColumn);
            const recordWithOriginalColumnKeys = await editedRecord.load(attrs);
            let newRow = { ...initialRow, ...recordWithOriginalColumnKeys };
            const attrsWithoutScalar = attrs.filter(att => att.indexOf('?') === -1);

            const atPattern = /^.+\/.+@.*$/;

            for (const att of attrsWithoutScalar) {
              const attr = attributes[att];

              if (attr) {
                let displayName = null;
                const component = allComponents.find(component => component.key === att && component.type === 'ecosSelect');

                if (isString(attr) && atPattern.test(attr)) {
                  displayName = await Records.get(attr).load('.disp');
                }

                if (component && !displayName) {
                  const option = get(component, 'currentItems', []).find(item => item.value === attr);
                  displayName = isObject(option.label) ? getMLValue(option.label) : option.label;
                }

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
