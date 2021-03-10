import FormIODataGridComponent from 'formiojs/components/datagrid/DataGrid';

import { overrideTriggerChange } from '../misc';

export default class DataGridComponent extends FormIODataGridComponent {
  constructor(...args) {
    super(...args);

    overrideTriggerChange.call(this);
  }

  createHeader() {
    const hasTopButton = this.hasTopSubmit();
    const hasEnd = this.hasExtraColumn() || hasTopButton;
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
        this.visibleComponents.map(comp => {
          const th = this.ce('th');
          if (comp.validate && comp.validate.required) {
            th.setAttribute('class', 'field-required');
          }
          const title = comp.labelByLocale || comp.label || comp.title;

          if (title && !comp.dataGridLabel) {
            needsHeader = true;
            th.appendChild(this.text(title));
            this.createTooltip(th, comp);
          }
          return th;
        }),
        hasEnd ? this.ce('th', null, hasTopButton ? this.addButton(true) : null) : null
      ])
    );

    return needsHeader ? thead : null;
  }
}