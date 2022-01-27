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
    const tr = super.buildRow(value, key, state);
    const lastChild = tr.lastChild;
    const flexBoxCentering = ' d-flex justify-content-center align-items-center';

    if (this.hasRemoveButtons()) {
      lastChild.className += flexBoxCentering;
      lastChild.firstChild.className += `${flexBoxCentering} mw-100`;
    }

    return tr;
  }
}
