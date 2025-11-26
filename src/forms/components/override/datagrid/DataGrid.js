import FormIODataGridComponent from 'formiojs/components/datagrid/DataGrid';
import { flattenComponents } from 'formiojs/utils/utils';
import cloneDeep from 'lodash/cloneDeep';
import forEach from 'lodash/forEach';
import forIn from 'lodash/forIn';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';
import isObject from 'lodash/isObject';
import pick from 'lodash/pick';

import { overrideTriggerChange } from '../misc';

import dragula from '@/services/dragula';

export default class DataGridComponent extends FormIODataGridComponent {
  constructor(...args) {
    super(...args);

    overrideTriggerChange.call(this);
  }

  get defaultValue() {
    const componentsKeys = Object.keys(flattenComponents(this.components));

    if (isEmpty(componentsKeys)) {
      return super.defaultValue;
    }

    return pick(super.defaultValue, componentsKeys);
  }

  get baseEmptyValue() {
    return (this.rows || []).map(row => {
      return Object.keys(row).reduce((res, cur) => {
        res = Object.assign(res, this.getEmptyValues(row[cur]));

        return res;
      }, {});
    });
  }

  getEmptyValues = component => {
    if (Array.isArray(component.components)) {
      return component.components.reduce((res, cur) => {
        if (cur.type !== 'hidden') {
          return { ...res, ...this.getEmptyValues(cur) };
        }

        return res;
      }, {});
    }

    return { [component.key]: component.defaultValue || component.emptyValue };
  };

  restoreComponentsContext() {
    this.rows.forEach((row, index) =>
      forIn(row, component => {
        component.data = this.dataValue[index] || component.data;
      })
    );
  }

  isEmptyRow(row) {
    const comps = flattenComponents(this.component.components);
    return Object.keys(comps).every(key => {
      const comp = comps[key];
      const emptyVal = comp.emptyValue ?? comp.defaultValue ?? null;

      if (comp.type === 'mlText') {
        return Object.keys(row[key]).every(lang => {
          return isEmpty(row[key][lang]);
        });
      }

      return isEqual(row[key], emptyVal);
    });
  }

  getNotEmptyValue() {
    return (super.getValue() || []).filter(row => !this.isEmptyRow(row));
  }

  checkValidity(data, dirty, rowData) {
    if (isEqual(this.dataValue, this.baseEmptyValue)) {
      return true;
    }

    return super.checkValidity(data, dirty, rowData);
  }

  createLastTh = () => {
    const hasBottomButton = this.hasBottomSubmit();
    const hasBottomEnd = this.hasExtraColumn() && hasBottomButton;

    return hasBottomEnd ? this.ce('th', { class: 'formio-drag-small-column' }) : null;
  };

  createAddButton = () => {
    return this.hasTopSubmit() ? this.addButton('true') : null;
  };

  createHeader() {
    const hideHeader = get(this, 'component.options.hideHeader', false);
    const hasEnd = this.hasExtraColumn() && this.hasTopSubmit();

    if (hideHeader) {
      return null;
    }

    let needsHeader = false;

    const thead = this.ce(
      'thead',
      null,
      this.ce('tr', null, [
        this.allowReorder
          ? this.ce('th', {
              class: 'formio-drag-column-header'
            })
          : null,
        this.visibleComponents.map((comp, index) => {
          const th = this.ce('th');
          if (comp.validate && comp.validate.required) {
            th.classList.add('field-required');
          }

          if (hasEnd && this.visibleComponents.length - 1 === index) {
            th.classList.add('formio-drag-small-last-column');
          }

          const title = comp.labelByLocale || comp.label || comp.title;

          if (title && !comp.dataGridLabel) {
            needsHeader = true;
            th.appendChild(this.text(title));
            this.createTooltip(th, comp);
          }

          return th;
        }),

        hasEnd ? this.ce('th', null, this.createAddButton()) : null,
        this.createLastTh()
      ])
    );

    return needsHeader ? thead : null;
  }

  addDraggable(containers) {
    this.dragula = dragula(containers, this.getRowDragulaOptions()).on('drop', this.onRowDrop.bind(this));
  }

  setValue(value, flags) {
    flags = this.getFlags.apply(this, arguments);

    if (!value) {
      this.dataValue = this.defaultValue;
      this.buildRows();
      return;
    }

    if (!Array.isArray(value)) {
      if (isObject(value)) {
        value = [value];
      } else {
        this.buildRows();
        return;
      }
    }
    const changed = this.hasChanged(value, this.dataValue); //always should build if not built yet OR is trying to set empty value (in order to prevent deleting last row)
    let shouldBuildRows = !this.isBuilt || changed || isEqual(this.emptyValue, value); //check if visible columns changed
    let visibleColumnsAmount = 0;
    forEach(this.visibleColumns, function (value) {
      if (value) {
        visibleColumnsAmount++;
      }
    });
    const visibleComponentsAmount = this.visibleComponents ? this.visibleComponents.length : 0; //should build if visible columns changed
    shouldBuildRows = shouldBuildRows || visibleColumnsAmount !== visibleComponentsAmount; //loop through all rows and check if there is field in new value that differs from current value
    const keys = this.componentComponents.map(function (component) {
      return component.key;
    });
    for (let i = 0; i < value.length; i++) {
      if (shouldBuildRows) {
        break;
      }

      const valueRow = value[i];

      if (!valueRow) {
        continue;
      }

      for (let j = 0; j < keys.length; j++) {
        const key = keys[j];
        const newFieldValue = valueRow[key];
        const currentFieldValue = this.rows[i] && this.rows[i][key] ? this.rows[i][key].getValue() : undefined;
        const defaultFieldValue = this.rows[i] && this.rows[i][key] ? this.rows[i][key].defaultValue : undefined;
        const isMissingValue = newFieldValue === undefined && currentFieldValue === defaultFieldValue;
        if (!isMissingValue && !isEqual(newFieldValue, currentFieldValue)) {
          shouldBuildRows = true;
          break;
        }
      }
    }
    this.dataValue = value;
    let rowsValue = value;
    if (shouldBuildRows) {
      // buildRows() may change dataValue
      rowsValue = cloneDeep(rowsValue);
      this.buildRows();
    }
    this.rows.forEach((row, index) => {
      if (rowsValue.length <= index) {
        return;
      }
      forIn(row, component => {
        return this.setNestedValue(component, rowsValue[index], flags);
      });
    });

    return changed;
  }
}
