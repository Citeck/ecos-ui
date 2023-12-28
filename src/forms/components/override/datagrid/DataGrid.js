import FormIODataGridComponent from 'formiojs/components/datagrid/DataGrid';
import { flattenComponents } from 'formiojs/utils/utils';
import isEqual from 'lodash/isEqual';
import isEmpty from 'lodash/isEmpty';
import pick from 'lodash/pick';
import forIn from 'lodash/forIn';
import get from 'lodash/get';

import { overrideTriggerChange } from '../misc';
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
    const hideHeader = get(this, 'options.hideHeader', false);
    const hasEnd = this.hasExtraColumn() && this.hasTopSubmit();

    if (hideHeader) {
      return true;
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
}
