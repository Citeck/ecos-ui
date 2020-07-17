import FormIODataGridComponent from 'formiojs/components/datagrid/DataGrid';
import { isNodeRef } from '../../../../helpers/util';
import EcosFormUtils from '../../../../components/EcosForm/EcosFormUtils';
import Records from '../../../../components/Records/Records';

export default class DataGridComponent extends FormIODataGridComponent {
  static schema(...extend) {
    return FormIODataGridComponent.schema(
      {
        label: 'Data Grid Assoc',
        key: 'dataGridAssoc',
        type: 'datagridAssoc',
        multiple: true
      },
      ...extend
    );
  }

  static get builderInfo() {
    return {
      title: 'Data Grid Assoc',
      icon: 'fa fa-th',
      group: 'data',
      documentation: 'http://help.form.io/userguide/#datagrid',
      weight: 21,
      schema: DataGridComponent.schema()
    };
  }

  get defaultSchema() {
    return DataGridComponent.schema();
  }

  build() {
    super.build();

    const attribute = (this.component.properties || {}).attribute || this.key;
    const recordId = this.root.options.recordId || '@';
    EcosFormUtils.getCreateVariants(recordId, attribute).then(cv => {
      if (Array.isArray(cv) && cv.length > 0) {
        this.component.recordRef = cv[0].recordRef;
      }
    });
  }

  setValue(value, flags) {
    if (!Array.isArray(value)) {
      value = [value];
    }

    if (DataGridComponent.hasNodeRefsInValueList(value)) {
      const inputs = EcosFormUtils.getFormInputs(this.component);

      let keysMapping = {};
      let inputByAtt = {};

      for (let i = 0; i < inputs.length; i++) {
        let key = inputs[i].component.key;
        keysMapping[key] = inputs[i].schema;
        inputByAtt[inputs[i].attribute] = {
          ...inputs[i],
          key: key
        };
      }

      const valuesPromises = [];
      for (let i = 0; i < value.length; i++) {
        if (isNodeRef(value[i])) {
          valuesPromises.push(
            new Promise(resolve => {
              const rec = Records.get(value[i]);
              rec.load(Object.values(keysMapping)).then(() => {
                rec.toJsonAsync().then(recordJson => {
                  const dataGridValue = { id: recordJson.id };
                  for (let a in recordJson.attributes) {
                    dataGridValue[inputByAtt[a].key] = recordJson.attributes[a];
                  }
                  resolve(dataGridValue);
                });
              });
            })
          );
        } else {
          valuesPromises.push(new Promise(resolve => resolve(value[i])));
        }
      }

      return Promise.all(valuesPromises).then(values => {
        super.setValue(values, flags);
      });
    }

    super.setValue(value, flags);
  }

  static hasNodeRefsInValueList(value) {
    if (Array.isArray(value) && value.length > 0) {
      for (let i = 0; i < value.length; i++) {
        if (isNodeRef(value[i])) {
          return true;
        }
      }
    }
    return false;
  }

  static convertToAssoc(value, input, keysMapping) {
    if (!input.component.recordRef) {
      return value;
    }

    const mapping = v => {
      let childRecord = Records.getRecordToEdit(input.component.recordRef);

      for (let k in v) {
        if (!v.hasOwnProperty(k)) {
          continue;
        }
        childRecord.att(keysMapping[k] || k, v[k]);
      }

      return childRecord.id;
    };

    if (Array.isArray(value)) {
      value = value.map(mapping);
    } else {
      value = mapping(value);
    }

    return value;
  }
}
