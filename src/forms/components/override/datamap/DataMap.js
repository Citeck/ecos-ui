import isEqual from 'lodash/isEqual';
import omitBy from 'lodash/omitBy';
import Components from 'formiojs/components/Components';
import FormIODataMapComponent from 'formiojs/components/datamap/DataMap';

import { t } from '../../../../helpers/export/util';

export default class DataMapComponent extends FormIODataMapComponent {
  static schema(...extend) {
    return FormIODataMapComponent.schema(
      {
        addAnother: t('ecos.forms.btn.add-another')
      },
      ...extend
    );
  }
  get defaultSchema() {
    return DataMapComponent.schema();
  }

  static optimizeSchema(comp) {
    const optimizedComponent = { ...comp };
    const valueComponent = comp.valueComponent;

    if (valueComponent && valueComponent.type) {
      const cmp = Components.components[valueComponent.type];
      if (cmp) {
        const valueComponentDefaultSchema = cmp.schema();
        const leaveAtts = ['key', 'type', 'input'];
        const removeAtts = ['id', 'widget'];

        optimizedComponent.valueComponent = omitBy(comp.valueComponent, (value, key) => {
          if (leaveAtts.includes(key)) {
            return false;
          }
          if (removeAtts.includes(key)) {
            return true;
          }
          return isEqual(valueComponentDefaultSchema[key], value);
        });
      }
    }

    return optimizedComponent;
  }

  buildRow(value, key, state) {
    if (!this.rows[key]) {
      this.rows[key] = this.createValueComponent(state);
    }

    var row = this.rows[key];
    var lastColumn = null;

    if (this.hasRemoveButtons()) {
      row.remove = this.removeKeyButton(key);
      lastColumn = this.ce(
        'td',
        {
          class: 'col-1 col-sm-1'
        },
        row.remove
      );
    }

    row.element = this.ce('tr', {
      class: 'd-flex',
      id: ''.concat(this.component.id, '-row-').concat(key)
    });

    row.keyInput = this.ce('input', {
      type: 'text',
      class: 'form-control',
      id: ''.concat(this.component.id, '-value-').concat(key),
      value: key
    });
    this.addInput(row.keyInput);

    if (this.component.keyBeforeValue) {
      row.element.appendChild(
        this.ce(
          'td',
          {
            class: 'col-2 col-sm-3'
          },
          row.keyInput
        )
      );
      row.element.appendChild(row.container);
    } else {
      row.element.appendChild(row.container);
      row.element.appendChild(this.ce('td', null, row.keyInput));
    }

    lastColumn && row.element.appendChild(lastColumn);

    row.value.setValue(value);

    if (this.hasRemoveButtons()) {
      const flexBoxCentering = ' d-flex justify-content-center align-items-center';
      lastColumn.className += flexBoxCentering;
      lastColumn.firstChild.className += `${flexBoxCentering} mw-100`;
    }

    return row.element;
  }
}
