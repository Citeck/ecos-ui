import FormIOColumnComponent from 'formiojs/components/columns/Column';

export default class ColumnComponent extends FormIOColumnComponent {
  get className() {
    const comp = this.component;
    const classList = [];

    if (this.options.viewAsHtmlConfig && this.options.viewAsHtmlConfig.fullWidthColumns) {
      classList.push('col-12', 'p-0', 'm-0');

      return classList.join(' ');
    }

    // TODO check it
    if (!comp.xs && !comp.sm) {
      classList.push('col', `col-sm-${comp.width ? comp.width : 6}`);
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
