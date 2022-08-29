import NestedComponent from 'formiojs/components/nested/NestedComponent';
import FormIOColumnsComponent from 'formiojs/components/columns/Columns';
import _ from 'lodash';
import Webform from 'formiojs/Webform';

export default class ColumnsComponent extends FormIOColumnsComponent {
  static schema(...extend) {
    return NestedComponent.schema(
      {
        label: 'Columns',
        key: 'columns',
        type: 'columns',
        columns: [{ components: [], xs: 0, sm: 12, md: 6, lg: 0, xl: 0, classes: '' }],
        clearOnHide: false,
        input: false,
        inlineColumns: false,
        tableView: false,
        persistent: false,
        autoAdjust: false,
        hideOnChildrenHidden: false,
        oneColumnInViewMode: undefined
      },
      ...extend
    );
  }

  static get builderInfo() {
    return {
      ...super.builderInfo,
      schema: ColumnsComponent.schema()
    };
  }

  get defaultSchema() {
    return ColumnsComponent.schema();
  }

  // TODO delete when update formiojs to v4
  get schema() {
    const superSchema = Object.getOwnPropertyDescriptor(NestedComponent.prototype, 'schema').get.call(this);
    const schema = _.omit(superSchema, 'components');

    const saveIndices = schema.columns.map(item => item.index);
    const columnsNewLength = schema.columns.length;

    schema.columns = [];
    let lastIdx = 0;

    this.eachComponent((component, index) => {
      const colProps = _.omit(this.component.columns[index], ['components']);
      _.merge(component.component, colProps);
      schema.columns.push({ ...component.schema, index: lastIdx++ });
    });

    for (let i = this.components.length; i < this.component.columns.length; i++) {
      schema.columns.push({ ...this.component.columns[i], index: lastIdx++ });
    }

    if (columnsNewLength < schema.columns.length) {
      schema.columns = schema.columns
        .filter(item => saveIndices.some(index => item.index === index))
        .map((item, index) => ({ ...item, index }));
    }

    return schema;
  }

  _isSubmitColumn() {
    if (this.parent.constructor.name === 'Webform') {
      function checkComponents(elements) {
        try {
          const result = elements.reduce((result, component) => {
            if (component.info.attr.name.includes('data[submit]')) {
              console.log('here', component);
              return true;
            } else {
              if (!result) {
                return checkComponents(component.components);
              }
            }
          }, false);
          return result;
        } catch {}
      }
      console.log('components = ', this.parent.components);
      return checkComponents(this.parent.components);
    }
    return false;
  }

  get className() {
    // exclude this.options.fullWidthColumns case / caused by ECOSENT-902
    if (this.component.inlineColumns) {
      return 'row-with-inline-blocks';
    }

    const classList = ['row'];

    if (this._isSubmitColumn()) {
      console.log('in push block', classList);
      classList.push('ecos-form-submit-button-container');
    }

    if (this.options.fullWidthColumns) {
      classList.push('m-0', 'p-0');
    }

    classList.push(super.className);

    return classList.join(' ');
  }
}
