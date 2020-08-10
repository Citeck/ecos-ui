import isEqual from 'lodash/isEqual';
import omitBy from 'lodash/omitBy';
import Components from 'formiojs/components/Components';
import FormIODataMapComponent from 'formiojs/components/datamap/DataMap';

export default class DataMapComponent extends FormIODataMapComponent {
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
}
