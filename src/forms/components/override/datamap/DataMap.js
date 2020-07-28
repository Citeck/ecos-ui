import isEqual from 'lodash/isEqual';
import omitBy from 'lodash/omitBy';
import FormIODataMapComponent from 'formiojs/components/datamap/DataMap';

export default class DataMapComponent extends FormIODataMapComponent {
  static optimizeSchema(comp) {
    const defaultSchema = DataMapComponent.schema();
    const leaveAtts = ['key', 'type', 'input'];
    const removeAtts = ['id'];

    return {
      ...comp,
      valueComponent: omitBy(comp.valueComponent, (value, key) => {
        if (leaveAtts.includes(key)) {
          return false;
        }
        if (removeAtts.includes(key)) {
          return true;
        }
        return isEqual(defaultSchema[key], value);
      })
    };
  }
}
