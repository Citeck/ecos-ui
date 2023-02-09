import FormIODataGridComponent from 'formiojs/components/datagrid/DataGrid';
import { flattenComponents } from 'formiojs/utils/utils';
import isEqual from 'lodash/isEqual';
import isEmpty from 'lodash/isEmpty';
import pick from 'lodash/pick';
import throttle from 'lodash/throttle';

import { overrideTriggerChange, requestAnimationFrame } from '../misc';

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
        res[cur] = row[cur].emptyValue;

        return res;
      }, {});
    });
  }

  show = throttle(show => {
    if (show && !this.dataValue.length) {
      this.overrideBaseRow();
    }
  }, 100);

  overrideBaseRow() {
    if (!this.dataValue.length || isEqual(this.dataValue, this.baseEmptyValue)) {
      this.removeValue(0);
    }

    requestAnimationFrame(() => {
      if (!this.dataValue.length || !this.rows.length) {
        this.addValue();
      }
    });
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
    const hasEnd = this.hasExtraColumn() && this.hasTopSubmit();

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
