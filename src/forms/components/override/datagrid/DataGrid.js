import FormIODataGridComponent from 'formiojs/components/datagrid/DataGrid';
import isEqual from 'lodash/isEqual';

import { overrideTriggerChange } from '../misc';

export default class DataGridComponent extends FormIODataGridComponent {
  constructor(...args) {
    super(...args);

    overrideTriggerChange.call(this);
  }

  build(state) {
    super.build(state);

    requestAnimationFrame(() => {
      if (!this.dataValue.length) {
        this.addValue();
      }
    });
  }

  get baseEmptyValue() {
    return (this.rows || []).map(row => {
      return Object.keys(row).reduce((res, cur) => {
        res[cur] = row[cur].emptyValue;

        return res;
      }, {});
    });
  }

  checkValidity(data, dirty, rowData) {
    let isValid = super.checkValidity(data, dirty, rowData);

    if (!isValid && isEqual(this.dataValue, this.baseEmptyValue)) {
      isValid = true;
    }

    return isValid;
  }

  createLastTh = () => {
    const hasBottomButton = this.hasBottomSubmit();
    const hasBottomEnd = this.hasExtraColumn() && hasBottomButton;
    return hasBottomEnd ? this.ce('th', { class: 'formio-drag-small-column' }) : null;
  };

  createAddButton = () => {
    const hasTopButton = this.hasTopSubmit();
    return hasTopButton ? this.addButton('true') : null;
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
