import { t } from '../../../../helpers/util';
import Mapper from '../mapping/Mapper';
import formatterStore from '../formatters/formatterStore';

export const DEFAULT_FORMATTER = 'DefaultGqlFormatter';

/**
 * @deprecated see JournalsService
 */
export default class BaseDataSource {
  constructor(options) {
    options = options || {};
    const defaultOptions = this._getDefaultOptions();
    this.options = this._merge(defaultOptions, options);
    this._createVariants = null;
  }

  _getDefaultOptions() {
    return {};
  }

  _merge(target, source) {
    for (let key of Object.keys(source)) {
      if (source[key] instanceof Object && key in target) Object.assign(source[key], this._merge(target[key], source[key]));
    }

    Object.assign(target || {}, source);
    return target;
  }

  _getFormatter(options) {
    let name;
    let params;
    let defaultFormatter = formatterStore[DEFAULT_FORMATTER];

    if (options) {
      ({ name, params } = options);
    }

    let formatter = formatterStore[name || options] || defaultFormatter;

    params = params || {};

    return {
      formatter,
      params
    };
  }

  _getColumns(columns) {
    return columns.map((column, idx) => {
      const newColumn = { ...column };
      const formatterOptions = column.formatter || Mapper.getFormatterOptions(newColumn, idx);
      const { formatter, params } = this._getFormatter(formatterOptions);

      newColumn.dataField = newColumn.dataField || newColumn.attribute;
      newColumn.text = t(newColumn.text || newColumn.dataField);
      newColumn.formatExtraData = { formatter, params, createVariants: this._createVariants };
      newColumn.filterValue = (cell, row) => formatter.getFilterValue(cell, row, params);
      newColumn.editorRenderer = formatter.getEditor;

      return newColumn;
    });
  }
}
