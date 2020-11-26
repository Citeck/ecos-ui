import isFunction from 'lodash/isFunction';
import isObject from 'lodash/isObject';
import cloneDeep from 'lodash/cloneDeep';

import { getTextByLocale, t } from '../../../helpers/util';
import Mapper from '../../common/grid/mapping/Mapper';
import formatterStore from '../../common/grid/formatters/formatterStore';
import {
  COLUMN_DATA_TYPE_ASSOC,
  COLUMN_DATA_TYPE_AUTHORITY,
  COLUMN_DATA_TYPE_AUTHORITY_GROUP,
  COLUMN_DATA_TYPE_CATEGORY,
  COLUMN_DATA_TYPE_NODEREF,
  COLUMN_DATA_TYPE_TEXT
} from '../../Records/predicates/predicates';

const NOT_SORTABLE_TYPES = [
  COLUMN_DATA_TYPE_ASSOC,
  COLUMN_DATA_TYPE_AUTHORITY,
  COLUMN_DATA_TYPE_AUTHORITY_GROUP,
  COLUMN_DATA_TYPE_CATEGORY,
  COLUMN_DATA_TYPE_NODEREF
];

const GROUPABLE_TYPES = [
  COLUMN_DATA_TYPE_ASSOC,
  COLUMN_DATA_TYPE_AUTHORITY,
  COLUMN_DATA_TYPE_AUTHORITY_GROUP,
  COLUMN_DATA_TYPE_CATEGORY,
  COLUMN_DATA_TYPE_NODEREF,
  COLUMN_DATA_TYPE_TEXT
];

const DEFAULT_INNER_SCHEMA = ['disp:.disp'].join(',');

const getBoolOrElse = (value, orElse) => {
  if (value == null) {
    if (isFunction(orElse)) {
      return orElse();
    } else {
      return orElse;
    }
  }
  return value;
};

class JournalColumnsResolver {
  async resolve(columns) {
    if (!columns) {
      columns = [];
    }
    return columns.map((c, i) => this._resolveColumn(c, i));
  }

  _resolveColumn(column, index) {
    const type = column.type || 'text';
    const name = column.name || column.attribute;
    const label = this._getLabel(column);
    const multiple = column.multiple === true;

    const attribute = column.schema || column.attribute || column.name;
    const attSchema = `${attribute}${multiple ? '[]' : ''}{${column.innerSchema || DEFAULT_INNER_SCHEMA}}`;

    const editable = attribute === column.name && getBoolOrElse(column.editable, true);
    const searchable = getBoolOrElse(column.searchable, () => attribute === name);
    const sortable = getBoolOrElse(column.sortable, () => NOT_SORTABLE_TYPES.indexOf(type) === -1);
    const groupable = getBoolOrElse(column.groupable, () => GROUPABLE_TYPES.indexOf(type) === -1);
    const hidden = getBoolOrElse(column.hidden, false);
    const visible = getBoolOrElse(column.visible, () => getBoolOrElse(column.default, true));
    const defaultValue = getBoolOrElse(column['default'], true);

    const params = column.params || {};

    const updColumn = {
      ...column,
      name,
      type,
      label,
      params,
      hidden,
      visible,
      editable,
      sortable,
      multiple,
      groupable,
      searchable,
      attribute,
      attSchema,
      text: label,
      dataField: name,
      default: defaultValue
    };

    const formatterOptions = updColumn.formatter || Mapper.getFormatterOptions(cloneDeep(updColumn), index);
    const formatterData = this._getFormatter(formatterOptions);
    const formatAttSchema = formatterData.formatter.getQueryString(attribute);

    formatAttSchema && !updColumn.innerSchema && (updColumn.attSchema = formatAttSchema);
    updColumn.formatExtraData = { ...formatterData, createVariants: updColumn.createVariants };
    updColumn.filterValue = (cell, row) => formatterData.formatter.getFilterValue(cell, row, formatterData.params);
    updColumn.editorRenderer = formatterData.formatter.getEditor;

    return updColumn;
  }

  _getLabel(column) {
    let label;
    if (column.label) {
      label = isObject(column.label) ? getTextByLocale(column.label) : column.label;
    }
    label = label || column.text || column.name;
    return label ? t(label) : t('journal.cell.no-label');
  }

  _getFormatter(column) {
    let name;
    let params;
    let defaultFormatter = formatterStore.DefaultGqlFormatter;

    if (column) {
      ({ name, params } = column);
    }

    let formatter = formatterStore[name || column] || defaultFormatter;

    params = params || {};

    return {
      formatter,
      params
    };
  }
}

const INSTANCE = new JournalColumnsResolver();
export default INSTANCE;
