import { LOCAL_ID } from '@citeck/constants/journal';
import Records from '@citeck/records-core';
import Record from '@citeck/records-core/Record';
import { parseAttribute } from '@citeck/records-core/utils/attStrUtils';
import { evaluate as formioEvaluate } from 'formiojs/utils/utils';
import _ from 'lodash';
import cloneDeep from 'lodash/cloneDeep';
import get from 'lodash/get';
import isArray from 'lodash/isArray';
import isBoolean from 'lodash/isBoolean';
import isEmpty from 'lodash/isEmpty';
import isFunction from 'lodash/isFunction';
import isObject from 'lodash/isObject';
import isString from 'lodash/isString';
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';

import TableFormPropTypes from './TableFormPropTypes';
import { getAllComponents } from './utils';

import { FORM_MODE_CLONE, FORM_MODE_CREATE, FORM_MODE_EDIT, FORM_MODE_VIEW } from '@/components/forms/EcosForm';
import EcosFormUtils from '@/components/forms/EcosForm/EcosFormUtils';
import { getMLValue, t } from '@/helpers/util';

const FULL_RECORD_REF_PATTERN = /^.+\/.+@.*$/;
const SHORT_RECORD_REF_PATTERN = /^[^@\s/]+@[^@\s]+$/;
const MAX_DISPLAY_EVAL_PASSES = 3;

const isAssocRef = (value, allowShortRef = false) => {
  if (!isString(value) || !value) {
    return false;
  }

  if (FULL_RECORD_REF_PATTERN.test(value)) {
    return true;
  }

  return allowShortRef && (SHORT_RECORD_REF_PATTERN.test(value) || value[0] === '{');
};

const getComponentSchema = comp => (comp && isObject(comp.component) ? comp.component : comp);

const getValueDisplayNameJs = comp =>
  get(getComponentSchema(comp), 'computed.valueDisplayName', '') || get(comp, 'computed.valueDisplayName', '');

const createTrackingRecordProxy = (targetRecord, recordedAtts) => {
  if (!targetRecord || typeof Proxy !== 'function') {
    return targetRecord;
  }

  return new Proxy(targetRecord, {
    get(target, prop) {
      if (prop === 'att') {
        return name => {
          if (isString(name) && name) {
            recordedAtts.add(name);
          }

          return isFunction(target.att) ? target.att(name) : null;
        };
      }

      const value = target[prop];
      return isFunction(value) ? value.bind(target) : value;
    }
  });
};

export const extractAttsFromDisplayJs = script => {
  if (!script || !isString(script)) {
    return [];
  }

  const attrs = new Set();
  const directRe = /\.att\(\s*['"]([^'"]+)['"]\s*\)/g;
  let match;

  while ((match = directRe.exec(script)) !== null) {
    attrs.add(match[1]);
  }

  if (/\.att\(\s*[A-Za-z_$][A-Za-z0-9_$]*\s*\)/.test(script)) {
    const arrayRe = /\[([^\]]+)\]/g;
    let arrayMatch;

    while ((arrayMatch = arrayRe.exec(script)) !== null) {
      const strRe = /['"]([^'"]+)['"]/g;
      let strMatch;

      while ((strMatch = strRe.exec(arrayMatch[1])) !== null) {
        attrs.add(strMatch[1]);
      }
    }
  }

  return Array.from(attrs);
};

export const findColumnComponent = (attribute, allComponents = [], columns = [], expectedType = null) => {
  const matchComponent = comp => {
    if (!comp) {
      return false;
    }

    const schema = getComponentSchema(comp);
    const compKey = comp.key || get(schema, 'key');
    const compPropAttr = get(schema, 'properties.attribute') || get(comp, 'properties.attribute');
    const compAttr = compKey === attribute || compPropAttr === attribute;
    if (!compAttr) {
      return false;
    }

    const compType = comp.type || get(schema, 'type');
    return expectedType ? compType === expectedType : true;
  };

  const fromForm = (allComponents || []).find(matchComponent);
  if (fromForm) {
    return fromForm;
  }

  const colDef = (columns || []).find(c => c && c.attribute === attribute);
  const fromColumn = get(colDef, 'formatter.params.component', null);

  return matchComponent(fromColumn) ? fromColumn : null;
};

export const resolveSingleAssocDisplay = async (ref, sjComponent, fallbackDisp = null) => {
  if (!isString(ref) || !ref) {
    return ref;
  }

  const dispNameJs = getValueDisplayNameJs(sjComponent);
  if (dispNameJs) {
    try {
      const targetRef = ref[0] === '{' ? EcosFormUtils.initJsonRecord(ref) : ref;
      const targetRecord = Records.get(targetRef);
      const loadedAtts = new Set();
      let pendingAtts = extractAttsFromDisplayJs(dispNameJs);

      for (let pass = 0; pass < MAX_DISPLAY_EVAL_PASSES; pass++) {
        const toLoad = pendingAtts.filter(att => !loadedAtts.has(att));
        if (toLoad.length > 0 && isFunction(targetRecord.load)) {
          await targetRecord.load(toLoad);
          toLoad.forEach(att => loadedAtts.add(att));
        }

        const recordedAtts = new Set();
        const proxyRecord = createTrackingRecordProxy(targetRecord, recordedAtts);
        let disp;
        let evalError = null;

        try {
          disp = await Promise.resolve(formioEvaluate(dispNameJs, { _, value: proxyRecord }, 'disp', true));
        } catch (err) {
          evalError = err;
        }

        const missingAtts = Array.from(recordedAtts).filter(att => !loadedAtts.has(att));
        if (missingAtts.length > 0 && isFunction(targetRecord.load)) {
          if (pass + 1 < MAX_DISPLAY_EVAL_PASSES) {
            pendingAtts = missingAtts;
            continue;
          }

          break;
        }

        if (evalError) {
          throw evalError;
        }

        if (disp) {
          return disp;
        }

        break;
      }
    } catch (e) {
      console.error('[TableFormContext] Failed to evaluate valueDisplayName', e);
    }
  }

  if (fallbackDisp != null && fallbackDisp !== '') {
    return fallbackDisp;
  }

  if (!isAssocRef(ref, Boolean(sjComponent))) {
    return ref;
  }

  const loadedDisp = await Records.get(ref).load('.disp');
  return loadedDisp || ref;
};

export const resolveAssocDisplayValue = async (attrValue, sjComponent, fallbackDisp = null) => {
  const allowShortRef = Boolean(sjComponent);

  if (isAssocRef(attrValue, allowShortRef)) {
    return resolveSingleAssocDisplay(attrValue, sjComponent, fallbackDisp);
  }

  if (isArray(attrValue)) {
    const hasAssocRef = attrValue.some(item => isAssocRef(item, allowShortRef));
    if (!hasAssocRef) {
      return null;
    }

    return Promise.all(
      attrValue.map((item, idx) => {
        const itemFallback = isArray(fallbackDisp) ? fallbackDisp[idx] : null;
        if (isAssocRef(item, allowShortRef)) {
          return resolveSingleAssocDisplay(item, sjComponent, itemFallback);
        }

        return itemFallback != null && itemFallback !== '' ? itemFallback : item;
      })
    );
  }

  return null;
};

export const buildRowFetchPlan = (columns = [], allComponents = []) => {
  const atts = [];
  const attsAsIs = [];
  const noNeedParseSchemas = new Set();

  columns.forEach(item => {
    const { attribute = '', multiple = false } = item || {};
    const isFullName = attribute.startsWith('.att');
    const hasBracket = attribute.includes('{');
    const hasQChar = attribute.includes('?');

    if (isFullName || hasBracket || hasQChar) {
      atts.push(attribute);
      noNeedParseSchemas.add(attribute);
      return;
    }

    const multiplePostfix = multiple ? 's' : '';
    const sjComponent = findColumnComponent(attribute, allComponents, columns, 'selectJournal');
    if (getValueDisplayNameJs(sjComponent)) {
      atts.push(`.att${multiplePostfix}(n:"${attribute}"){id}`);
      atts.push(`.att${multiplePostfix}(n:"${attribute}"){disp}`);
    } else {
      atts.push(`.att${multiplePostfix}(n:"${attribute}"){disp}`);
    }
    attsAsIs.push(attribute);
  });

  return { atts, attsAsIs, noNeedParseSchemas };
};

export const resolveColumnDisplayName = async (attribute, attrValue, allComponents = [], columns = []) => {
  if (attrValue == null) {
    return null;
  }

  let displayName = null;
  const sjComponent = findColumnComponent(attribute, allComponents, columns, 'selectJournal');

  try {
    displayName = await resolveAssocDisplayValue(attrValue, sjComponent);
  } catch (e) {
    // fallback to raw value
  }

  if (!displayName) {
    const selectComponent = findColumnComponent(attribute, allComponents, columns, 'ecosSelect');
    if (selectComponent) {
      const option = get(selectComponent, 'currentItems', []).find(item => item.value === attrValue);
      if (option) {
        displayName = isObject(option.label) ? getMLValue(option.label) : option.label;
      }
    }
  }

  return displayName;
};

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
  const [journalActions, setJournalActions] = useState(controlProps.journalActions);

  useEffect(() => {
    if (controlProps.registerJournalActionsSetter) {
      controlProps.registerJournalActionsSetter(setJournalActions);
    }
  }, []);

  useEffect(() => {
    if (controlProps.journalActions) {
      setJournalActions(controlProps.journalActions);
    }
  }, [controlProps.journalActions]);

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
      Promise.all(
        initValue.map(async rec => {
          const record = await Records.get(rec);
          const form = await EcosFormUtils.getForm(rec);

          let allComponents = [];

          if (form && isFunction(form.load)) {
            const definition = await form.load('definition?json');
            allComponents = getAllComponents(definition.components);
          }

          const { atts, attsAsIs, noNeedParseSchemas } = buildRowFetchPlan(columns, allComponents);
          const fetchedAtts = {};
          let result = {};

          if (record.isBaseRecord()) {
            result = await record.load(atts, forceReload);
          } else {
            result = await record.toJsonAsync(true).then(res => get(res, 'attributes') || {});
            const nonExistAttrs = attsAsIs.filter(item => !Object.keys(result).includes(item));

            if (!isEmpty(nonExistAttrs)) {
              const more = await record.load(nonExistAttrs, forceReload);
              result = { ...result, ...more };
            }
          }

          const notExistsResult = await record.load('_notExists?bool');
          const isNotExists = notExistsResult === true;

          if (isNotExists) {
            columns.forEach(column => {
              fetchedAtts[column.attribute] = t('comp.no-data.head');
            });

            fetchedAtts['_notExists?bool'] = true;
          } else {
            for (let attSchema in result) {
              if (!result.hasOwnProperty(attSchema)) {
                continue;
              }

              if (noNeedParseSchemas.has(attSchema)) {
                fetchedAtts[attSchema] = result[attSchema];
                continue;
              }

              const attData = parseAttribute(attSchema);
              if (!attData) {
                continue;
              }

              const multiplePostfix = attData.isMultiple ? 's' : '';
              const companionIdSchema = `.att${multiplePostfix}(n:"${attData.name}"){id}`;
              const companionDispSchema = `.att${multiplePostfix}(n:"${attData.name}"){disp}`;

              if (attData.scalar === 'disp' && Object.prototype.hasOwnProperty.call(result, companionIdSchema)) {
                continue;
              }

              const rawVal = result[attSchema];
              const fallbackDisp = Object.prototype.hasOwnProperty.call(result, companionDispSchema) ? result[companionDispSchema] : null;
              const sjComponent = findColumnComponent(attData.name, allComponents, columns, 'selectJournal');
              if (sjComponent && getValueDisplayNameJs(sjComponent)) {
                if (rawVal != null && !isEmpty(rawVal)) {
                  const resolved = await resolveAssocDisplayValue(rawVal, sjComponent, fallbackDisp);
                  if (resolved != null) {
                    fetchedAtts[attData.name] = resolved;
                    continue;
                  }
                }
                if (fallbackDisp != null) {
                  fetchedAtts[attData.name] = fallbackDisp;
                  continue;
                }
              }

              const component = allComponents.find(comp => comp.key === attData.name && comp.type === 'ecosSelect');

              if (component) {
                const option = get(component, 'data.values', []).find(item => item.value === rawVal);

                if (option) {
                  fetchedAtts[attData.name] = isObject(option.label) ? getMLValue(option.label) : option.label;
                  continue;
                }

                if (!record.isBaseRecord() && rawVal) {
                  try {
                    const options = await record.load(`#${attData.name}?options`);
                    if (isArray(options)) {
                      const typeOption = options.find(item => item.value === rawVal);
                      if (typeOption) {
                        fetchedAtts[attData.name] = isObject(typeOption.label) ? getMLValue(typeOption.label) : typeOption.label;
                        continue;
                      }
                    }
                  } catch (e) {
                    // fallback to raw value below
                  }
                }
              }

              if (!record.isBaseRecord()) {
                const resolved = await resolveAssocDisplayValue(rawVal, sjComponent);
                if (resolved != null) {
                  fetchedAtts[attData.name] = resolved;
                  continue;
                }
              }

              fetchedAtts[attData.name] = rawVal;
            }
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

    record
      .toJsonAsync(true)
      .then(async res => {
        const attributes = cloneDeep(res.attributes);
        const restAttrs = Object.keys(attributes);

        for (let column of columns) {
          if (column.attribute in attributes) {
            const index = restAttrs.findIndex(value => value === column.attribute);
            const displayName = await resolveColumnDisplayName(column.attribute, res.attributes[column.attribute], allComponents, columns);

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

        const newRow = {
          id: record.id,
          [LOCAL_ID]: record.id,
          ...attributes
        };

        const newGridRows = [...gridRows, newRow];
        setGridRows(newGridRows);

        onChangeHandler(newGridRows);
      })
      .catch(e => {
        console.error('[TableForm] onCreateFormSubmit error:', e);
      });
  };

  return (
    <TableFormContext.Provider
      value={{
        controlProps: {
          ...controlProps,
          journalActions
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
          // Lazy import breaks the TableFormContext -> WidgetService edge that closed every
          // import cycle through WidgetService (prod-only "Cannot access 'WidgetService'
          // before initialization" TDZ).
          import('@/services/WidgetService').then(({ default: WidgetService }) => {
            WidgetService.openPreviewModal({ recordId });
          });
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

            for (const att of attrsWithoutScalar) {
              const attr = attributes[att];

              if (attr) {
                const displayName = await resolveColumnDisplayName(att, attr, allComponents, columns);

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
              for (const column of columns) {
                const attr = res['attributes'] ? res['attributes'][column.attribute] : undefined;
                if (attr != null) {
                  const displayName = await resolveColumnDisplayName(column.attribute, attr, allComponents, columns);
                  if (displayName) {
                    newRow[column.attribute] = displayName;
                  }
                }
              }
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
