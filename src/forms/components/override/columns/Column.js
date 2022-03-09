import FormIOColumnComponent from 'formiojs/components/columns/Column';
import _ from 'lodash';

export default class ColumnComponent extends FormIOColumnComponent {
  static schema(...extend) {
    return FormIOColumnComponent.schema(
      {
        classes: '',
        xs: 0,
        sm: 12,
        md: 6,
        lg: 0,
        xl: 0,
        width: 6,
        offset: 0,
        push: 0,
        pull: 0,
        clearOnHide: false,
        label: '',
        hideOnChildrenHidden: false
      },
      ...extend
    );
  }

  get defaultSchema() {
    return ColumnComponent.schema();
  }

  get className() {
    // exclude options.fullWidthColumns case / caused by ECOSENT-902
    if (this.parent.component.inlineColumns) {
      return 'col-inline-block';
    }

    const comp = this.component;
    const options = this.options;
    const classList = [];

    if (options.fullWidthColumns) {
      classList.push('col-12', 'col-12-manual', 'p-0', 'm-0');

      return classList.join(' ');
    }

    const isOneColumnPanelViewModeEnabled = _.get(this, 'parent.component.oneColumnPanelViewModeEnabled', true);
    const isPanelContainer = _.get(this, 'parent.parent.component.type') === 'panel';

    if (this.viewOnly && isOneColumnPanelViewModeEnabled && isPanelContainer) {
      classList.push('col-12');
      return classList.join(' ');
    }

    // TODO check it
    if (!comp.xs && !comp.sm) {
      const width = `col-sm-${comp.width ? comp.width : 6}`;
      classList.push('col', width);
    }

    const xs = comp.xs || comp.width;
    if (xs) {
      classList.push(`col-xs-${xs}`);
    }

    if (comp.sm) {
      classList.push(`col-sm-${comp.sm}`);
    }

    if (comp.md) {
      classList.push(`col-md-${comp.md}`);
    }

    if (comp.lg) {
      classList.push(`col-lg-${comp.lg}`);
    }

    if (comp.xl) {
      classList.push(`col-xl-${comp.xl}`);
    }

    if (comp.classes) {
      classList.push(...comp.classes.split(/[ ,]+/));
    }

    return classList.join(' ');
  }
}
