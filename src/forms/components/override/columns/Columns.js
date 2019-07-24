import NestedComponent from 'formiojs/components/nested/NestedComponent';
import FormIOColumnsComponent from 'formiojs/components/columns/Columns';

export default class ColumnsComponent extends FormIOColumnsComponent {
  static schema(...extend) {
    return NestedComponent.schema(
      {
        label: 'Columns',
        key: 'columns',
        type: 'columns',
        columns: [
          { components: [], classes: '' },
          { components: [], classes: '' }
          // { components: [], xs: 0, sm: 12, md: 6, lg: 0, xl: 0, classes: '' },
          // { components: [], xs: 0, sm: 12, md: 6, lg: 0, xl: 0, classes: '' }
        ],
        clearOnHide: false,
        input: false,
        tableView: false,
        persistent: false,
        autoAdjust: false,
        hideOnChildrenHidden: false
      },
      ...extend
    );
  }

  get className() {
    const classList = ['row'];

    if (this.options.viewAsHtmlConfig && this.options.viewAsHtmlConfig.fullWidthColumns) {
      classList.push('m-0', 'p-0');
    }

    return `${classList.join(' ')} ${super.className}`;
  }
}
