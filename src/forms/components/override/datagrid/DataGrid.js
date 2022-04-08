import FormIODataGridComponent from 'formiojs/components/datagrid/DataGrid';

import { overrideTriggerChange } from '../misc';

export default class DataGridComponent extends FormIODataGridComponent {
  constructor(...args) {
    super(...args);

    overrideTriggerChange.call(this);
  }

  createHeader() {
    const hasTopButton = this.hasTopSubmit();
    const hasBottomButton = this.hasBottomSubmit();
    const hasEnd = this.hasExtraColumn() && hasTopButton;
    const hasBottomEnd = this.hasExtraColumn() && hasBottomButton;
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
            th.setAttribute('class', 'field-required');
          }

          if (hasEnd && this.visibleComponents.length - 1 === index) {
            th.setAttribute('class', 'formio-drag-small-last-column');
          }

          const title = comp.labelByLocale || comp.label || comp.title;

          if (title && !comp.dataGridLabel) {
            needsHeader = true;
            th.appendChild(this.text(title));
            this.createTooltip(th, comp);
          }

          return th;
        }),

        hasEnd ? this.ce('th', null, hasTopButton ? this.addButton('true') : null) : null,
        hasBottomEnd ? this.ce('th', { class: 'formio-drag-small-column' }) : null
      ])
    );

    return needsHeader ? thead : null;
  }
}
